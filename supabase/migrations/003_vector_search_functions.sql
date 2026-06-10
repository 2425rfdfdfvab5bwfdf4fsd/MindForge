-- Semantic memory search function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(768),
  match_user_id  uuid,
  match_count    int DEFAULT 5
)
RETURNS TABLE (
  id          uuid,
  content     text,
  memory_type text,
  similarity  float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    memory_type,
    1 - (embedding <=> query_embedding) AS similarity
  FROM user_memories
  WHERE user_id = match_user_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Semantic cookie-jar search function
CREATE OR REPLACE FUNCTION match_cookie_jar(
  query_embedding vector(768),
  match_user_id  uuid,
  match_count    int DEFAULT 3
)
RETURNS TABLE (
  id          uuid,
  title       text,
  description text,
  similarity  float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    title,
    description,
    1 - (embedding <=> query_embedding) AS similarity
  FROM cookie_jar_entries
  WHERE user_id = match_user_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
