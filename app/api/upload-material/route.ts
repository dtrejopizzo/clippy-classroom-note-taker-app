import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { OpenAIEmbeddings } from "@langchain/openai"

export async function POST(request: NextRequest) {
  let materialId: string | null = null

  try {
    console.log("[v0] Starting material upload and processing")

    const formData = await request.formData()
    const courseId = formData.get("courseId") as string
    const title = formData.get("title") as string
    const fileType = formData.get("fileType") as string
    const file = formData.get("file") as File | null
    const content = formData.get("content") as string | null

    if (!courseId || !title || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Extracting text content")

    let textContent = ""

    if (content) {
      // Plain text input
      textContent = content
    } else if (file) {
      if (fileType === "pdf") {
        // Extract text from PDF
        console.log("[v0] Processing PDF file")
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log("[v0] PDF loaded, pages:", pdf.numPages)

        const textParts: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(" ")
          textParts.push(pageText)
        }

        textContent = textParts.join("\n\n")
        console.log("[v0] PDF text extracted, length:", textContent.length)
      } else if (fileType === "text") {
        // Read text file
        textContent = await file.text()
      }
    }

    if (!textContent || textContent.trim().length === 0) {
      throw new Error("No text content available")
    }

    console.log("[v0] Text content ready, length:", textContent.length)

    // Insert material record with content
    const { data: material, error: insertError } = await supabase
      .from("course_materials")
      .insert({
        course_id: courseId,
        teacher_id: user.id,
        title,
        file_type: fileType,
        file_url: null, // No storage URL needed
        content: textContent,
        processing_status: "processing",
      })
      .select()
      .single()

    if (insertError) throw insertError

    materialId = material.id

    console.log("[v0] Material record created, splitting text into chunks")

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
        source_id: materialId,
        chunk_text: chunk.pageContent,
        chunk_index: i + idx,
        embedding: JSON.stringify(batchEmbeddings[idx]),
        metadata: {
          file_type: fileType,
          title: title,
        },
      }))

      const { error: chunkInsertError } = await supabase.from("document_chunks").insert(chunksToInsert)

      if (chunkInsertError) {
        console.error("[v0] Error inserting chunks:", chunkInsertError)
        throw chunkInsertError
      }

      console.log("[v0] Inserted batch", Math.floor(i / batchSize) + 1)
    }

    // Update material status to completed
    await supabase
      .from("course_materials")
      .update({ processing_status: "completed", error_message: null })
      .eq("id", materialId)

    console.log("[v0] Material processing complete")

    return NextResponse.json({
      success: true,
      materialId,
      chunksCreated: chunks.length,
    })
  } catch (error) {
    console.error("[v0] Error processing material:", error)

    if (materialId) {
      const supabase = await createClient()
      await supabase
        .from("course_materials")
        .update({
          processing_status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", materialId)
    }

    return NextResponse.json(
      {
        error: "Failed to process material",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
