import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai"
import pdf from "pdf-parse"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting material processing")

    const { courseId, fileUrl, fileType } = await request.json()

    if (!courseId || !fileUrl || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching material from storage")

    // Fetch the file content
    let textContent = ""

    if (fileType === "pdf") {
      // Download PDF and extract text
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log("[v0] Extracting text from PDF")
      const pdfData = await pdf(buffer)
      textContent = pdfData.text
    } else if (fileType === "text") {
      // Download text file
      const response = await fetch(fileUrl)
      textContent = await response.text()
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json({ error: "No text content extracted from file" }, { status: 400 })
    }

    console.log("[v0] Text extracted, length:", textContent.length)

    // Get the material ID
    const { data: material } = await supabase
      .from("course_materials")
      .select("id")
      .eq("course_id", courseId)
      .eq("file_url", fileUrl)
      .single()

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 })
    }

    // Update material with extracted content
    await supabase.from("course_materials").update({ content: textContent }).eq("id", material.id)

    console.log("[v0] Splitting text into chunks")

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    const chunks = await textSplitter.createDocuments([textContent])

    console.log("[v0] Created", chunks.length, "chunks")

    // Generate embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    })

    console.log("[v0] Generating embeddings for chunks")

    // Process chunks in batches
    const batchSize = 10
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchTexts = batch.map((chunk) => chunk.pageContent)

      const batchEmbeddings = await embeddings.embedDocuments(batchTexts)

      // Insert chunks with embeddings into database
      const chunksToInsert = batch.map((chunk, idx) => ({
        course_id: courseId,
        source_type: "material",
        source_id: material.id,
        chunk_text: chunk.pageContent,
        chunk_index: i + idx,
        embedding: JSON.stringify(batchEmbeddings[idx]),
        metadata: {
          file_url: fileUrl,
          file_type: fileType,
        },
      }))

      const { error: insertError } = await supabase.from("document_chunks").insert(chunksToInsert)

      if (insertError) {
        console.error("[v0] Error inserting chunks:", insertError)
        throw insertError
      }

      console.log("[v0] Inserted batch", Math.floor(i / batchSize) + 1)
    }

    console.log("[v0] Material processing complete")

    return NextResponse.json({
      success: true,
      chunksCreated: chunks.length,
    })
  } catch (error) {
    console.error("[v0] Error processing material:", error)
    return NextResponse.json(
      {
        error: "Failed to process material",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
