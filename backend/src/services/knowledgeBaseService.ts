import { prisma } from '../db/client';
import { generateEmbedding } from './ragService';

export interface KnowledgeBaseInput {
  tenantId: string;
  title: string;
  content: string;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export async function ensureKnowledgeBaseVectorStore(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "KnowledgeBase" ADD COLUMN IF NOT EXISTS embedding vector(1536)'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "KnowledgeBase_embedding_hnsw_idx" ON "KnowledgeBase" USING hnsw (embedding vector_cosine_ops)'
    );
  } catch (error) {
    console.warn(
      '[KnowledgeBase] pgvector initialization failed. RAG will use text fallback until pgvector is available.',
      error
    );
  }
}

export async function refreshKnowledgeBaseEmbedding(
  id: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text);
  const vector = toVectorLiteral(embedding);

  await ensureKnowledgeBaseVectorStore();
  await prisma.$executeRawUnsafe(
    'UPDATE "KnowledgeBase" SET embedding = $1::vector WHERE id = $2',
    vector,
    id
  );
}

export async function createKnowledgeBaseEntry(input: KnowledgeBaseInput) {
  const entry = await prisma.knowledgeBase.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      content: input.content
    }
  });

  await refreshKnowledgeBaseEmbedding(
    entry.id,
    `${input.title}\n${input.content}`
  );

  return entry;
}

export async function updateKnowledgeBaseEntry(
  id: string,
  data: {
    title?: string;
    content?: string;
  }
) {
  const existing = await prisma.knowledgeBase.findUnique({
    where: { id }
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.knowledgeBase.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      content: data.content ?? existing.content
    }
  });

  await refreshKnowledgeBaseEmbedding(
    updated.id,
    `${updated.title}\n${updated.content}`
  );

  return updated;
}

export async function backfillKnowledgeBaseEmbeddings(
  tenantId?: string
): Promise<number> {
  await ensureKnowledgeBaseVectorStore();

  const rows = await prisma.knowledgeBase.findMany({
    where: tenantId ? { tenantId } : undefined
  });

  for (const row of rows) {
    await refreshKnowledgeBaseEmbedding(
      row.id,
      `${row.title}\n${row.content}`
    );
  }

  return rows.length;
}
