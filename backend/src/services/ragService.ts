import { prisma } from '../db/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';

/**
 * Generate a 1536-dimensional vector embedding for the input text.
 * Dynamically supports Google Gemini (text-embedding-004) or OpenAI/OpenRouter (text-embedding-3-small)
 * based on the active API key format.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = env.GEMINI_API_KEY || env.OPENAI_API_KEY || env.OPENROUTER_API_KEY || '';

  if (!apiKey || apiKey.startsWith('your-') || apiKey === 'dummy-key') {
    console.log('[RAG] Using mock vector embedding generator (no API key configured)');
    return new Array(1536).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length) || 1;
      return Math.sin(code + i) * 0.1;
    });
  }

  // 1. OpenAI / OpenRouter Key detected
  if (apiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: apiKey.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : undefined,
      });

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('[RAG] OpenAI embedding generation failed, falling back to mock:', error);
    }
  } 
  
  // 2. Google Gemini Key detected
  else {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const response = await model.embedContent(text.replace(/\n/g, ' '));
      return response.embedding.values;
    } catch (error) {
      console.error('[RAG] Gemini embedding generation failed, falling back to mock:', error);
    }
  }

  // Fallback reproducible mock vector
  return new Array(1536).fill(0).map((_, i) => {
    const code = text.charCodeAt(i % text.length) || 1;
    return Math.sin(code + i) * 0.1;
  });
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
<<<<<<< HEAD
         AND embedding IS NOT NULL
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
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
