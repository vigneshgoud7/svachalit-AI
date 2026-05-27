import { prisma } from '../db/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'dummy-key');

/**
 * Generate a 1536-dimensional vector embedding for the input text using Gemini API (text-embedding-004).
 * Returns a fallback mock vector if the Gemini key is missing/invalid for testing.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your-') || apiKey === 'dummy-key') {
    // Generate a reproducible mock vector for local-only testing
    console.log('[RAG] Using mock vector embedding generator (no Gemini API key configured)');
    const mockVector = new Array(1536).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length) || 1;
      return Math.sin(code + i) * 0.1;
    });
    return mockVector;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const response = await model.embedContent(text.replace(/\n/g, ' '));
    return response.embedding.values;
  } catch (error) {
    console.error('[RAG] Gemini embedding generation failed:', error);
    // Fallback to a reproducible mock vector to keep system running
    const mockVector = new Array(1536).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length) || 1;
      return Math.sin(code + i) * 0.1;
    });
    return mockVector;
  }
}

/**
 * Query pgvector entries in the KnowledgeBase table for a given tenant, ordered by similarity.
 * Falls back to standard database text matching if pgvector features are not supported on the target DB.
 */
export async function queryKnowledgeBase(tenantId: string, queryText: string, limit: number = 3): Promise<any[]> {
  try {
    const embedding = await generateEmbedding(queryText);
    const vectorStr = `[${embedding.join(',')}]`;

    // Query pgvector using PostgreSQL cosine distance operator `<=>`
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, title, content, (1 - (embedding <=> $1::vector)) as similarity
       FROM "KnowledgeBase"
       WHERE "tenantId" = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vectorStr,
      tenantId,
      limit
    );

    return results;
  } catch (error) {
    console.warn('[RAG] pgvector query failed or pgvector extension is missing. Falling back to text matching.', error);
    // Standard Prisma fallback text search
    const fallbackResults = await prisma.knowledgeBase.findMany({
      where: {
        tenantId,
        OR: [
          { content: { contains: queryText, mode: 'insensitive' } },
          { title: { contains: queryText, mode: 'insensitive' } }
        ]
      },
      take: limit
    });

    return fallbackResults.map(item => ({
      ...item,
      similarity: 0.5 // Static fallback score
    }));
  }
}
