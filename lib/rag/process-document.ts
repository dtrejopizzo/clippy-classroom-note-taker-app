import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from "@/lib/supabase/server"

export async function processDocumentForRAG(params: {
  courseId: string
  sourceType: "recording" | "material"
  sourceId: string
  text: string
  metadata?: Record<string, any>
}) {
  const { courseId, sourceType, sourceId, text, metadata = {} } = params

  console.log("[v0] Processing document for RAG, text length:", text.length)

  // Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  const chunks = await textSplitter.createDocuments([text])
  console.log("[v0] Created", chunks.length, "chunks")

  // Generate embeddings
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  })

  const supabase = await createClient()

  // Process chunks in batches
  const batchSize = 10
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const batchTexts = batch.map((chunk) => chunk.pageContent)

    console.log("[v0] Generating embeddings for batch", Math.floor(i / batchSize) + 1)
    const batchEmbeddings = await embeddings.embedDocuments(batchTexts)

    // Insert chunks with embeddings into database
    const chunksToInsert = batch.map((chunk, idx) => ({
      course_id: courseId,
      source_type: sourceType,
      source_id: sourceId,
      chunk_text: chunk.pageContent,
      chunk_index: i + idx,
      embedding: JSON.stringify(batchEmbeddings[idx]),
      metadata: metadata,
    }))

    const { error: insertError } = await supabase.from("document_chunks").insert(chunksToInsert)

    if (insertError) {
      console.error("[v0] Error inserting chunks:", insertError)
      throw insertError
    }

    console.log("[v0] Inserted batch", Math.floor(i / batchSize) + 1)
  }

  console.log("[v0] Document processing complete, created", chunks.length, "chunks")
  return chunks.length
}
