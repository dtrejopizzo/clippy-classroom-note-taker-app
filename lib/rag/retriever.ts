import { OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from "@/lib/supabase/server"

export async function retrieveRelevantChunks(courseId: string, query: string, topK = 5) {
  console.log("[v0] Retrieving relevant chunks for query:", query)

  // Generate embedding for the query
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  })

  const queryEmbedding = await embeddings.embedQuery(query)
  console.log("[v0] Query embedding generated")

  // Search for similar chunks using cosine similarity
  const supabase = await createClient()

  // Use Supabase's vector similarity search
  const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_course_id: courseId,
    match_count: topK,
  })

  if (error) {
    console.error("[v0] Error retrieving chunks:", error)
    throw error
  }

  console.log("[v0] Retrieved", chunks?.length || 0, "relevant chunks")

  return chunks || []
}
