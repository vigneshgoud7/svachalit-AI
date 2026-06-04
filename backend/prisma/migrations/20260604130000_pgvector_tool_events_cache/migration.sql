CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeBase"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "KnowledgeBase_embedding_hnsw_idx"
  ON "KnowledgeBase"
  USING hnsw ("embedding" vector_cosine_ops);

CREATE TABLE IF NOT EXISTS "ToolEvent" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "input" JSONB,
  "output" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ToolEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ToolEvent_conversationId_createdAt_idx"
  ON "ToolEvent" ("conversationId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ToolEvent_conversationId_fkey'
  ) THEN
    ALTER TABLE "ToolEvent"
      ADD CONSTRAINT "ToolEvent_conversationId_fkey"
      FOREIGN KEY ("conversationId")
      REFERENCES "Conversation"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ResponseCache" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResponseCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ResponseCache_cacheKey_key"
  ON "ResponseCache" ("cacheKey");

CREATE INDEX IF NOT EXISTS "ResponseCache_tenantId_expiresAt_idx"
  ON "ResponseCache" ("tenantId", "expiresAt");
