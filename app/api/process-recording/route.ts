import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  let recordingId: string | undefined
  let errorDetails = ""

  try {
    console.log("[v0] Starting process-recording API")
    errorDetails = "Checking environment variables"

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] GROQ_API_KEY is not set")
      return NextResponse.json(
        {
          error: "Server configuration error: Missing GROQ_API_KEY",
          details: "GROQ_API_KEY environment variable is not configured",
        },
        { status: 500 },
      )
    }

    errorDetails = "Parsing request body"
    const body = await request.json()
    recordingId = body.recordingId

    console.log("[v0] Processing recording:", recordingId)

    if (!recordingId) {
      return NextResponse.json({ error: "Recording ID is required" }, { status: 400 })
    }

    errorDetails = "Creating Supabase client"
    const supabase = await createClient()

    // Get the recording
    errorDetails = "Fetching recording from database"
    console.log("[v0] Fetching recording from database")
    const { data: recording, error: fetchError } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single()

    if (fetchError || !recording) {
      console.error("[v0] Recording not found:", fetchError)
      return NextResponse.json(
        {
          error: "Recording not found",
          details: fetchError?.message || "No recording found with this ID",
        },
        { status: 404 },
      )
    }

    console.log("[v0] Recording found, updating status to processing")
    errorDetails = "Updating status to processing"
    await supabase.from("recordings").update({ status: "processing" }).eq("id", recordingId)

    // Fetch the audio file
    errorDetails = "Fetching audio file from storage"
    console.log("[v0] Fetching audio file from:", recording.audio_url)
    const audioResponse = await fetch(recording.audio_url)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`)
    }
    const audioBlob = await audioResponse.blob()
    console.log("[v0] Audio file fetched, size:", audioBlob.size, "type:", audioBlob.type)

    // Prepare audio file for transcription
    errorDetails = "Preparing audio file for transcription"

    // Determine the correct file extension and MIME type
    let mimeType = audioBlob.type || "audio/webm"
    let fileExtension = "webm"

    // Map MIME types to extensions
    if (mimeType.includes("webm")) {
      fileExtension = "webm"
      mimeType = "audio/webm"
    } else if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
      fileExtension = "m4a"
      mimeType = "audio/mp4"
    } else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
      fileExtension = "mp3"
      mimeType = "audio/mpeg"
    } else if (mimeType.includes("wav")) {
      fileExtension = "wav"
      mimeType = "audio/wav"
    }

    console.log("[v0] Using MIME type:", mimeType, "extension:", fileExtension)

    // Transcribe using Groq Whisper
    errorDetails = "Calling Groq Whisper API for transcription"
    console.log("[v0] Starting transcription with Groq Whisper")
    const formData = new FormData()
    formData.append("file", audioBlob, `audio.${fileExtension}`)
    formData.append("model", "whisper-large-v3-turbo")
    formData.append("response_format", "json")
    // Whisper will auto-detect between these languages for better accuracy
    formData.append("language", "es") // Spanish - change to "en" for English or remove for auto-detect

    const transcriptionResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text()
      console.error("[v0] Transcription failed:", transcriptionResponse.status, errorText)
      throw new Error(`Transcription failed (${transcriptionResponse.status}): ${errorText}`)
    }

    errorDetails = "Parsing transcription response"
    const transcriptionData = await transcriptionResponse.json()
    const transcription = transcriptionData.text
    console.log("[v0] Transcription completed, length:", transcription.length)

    if (!transcription || transcription.trim().length === 0) {
      throw new Error("Transcription returned empty text")
    }

    // Generate summary and study materials using AI SDK
    errorDetails = "Generating summary with AI"
    console.log("[v0] Generating summary with AI")
    const summaryPrompt = `You are an educational assistant helping teachers create study materials. 

Based on this lecture transcription, create a comprehensive summary with key points that students can use for studying.

Transcription:
${transcription}

Please provide:
1. A brief overview (2-3 sentences)
2. Key concepts and main points (bullet points)
3. Important definitions or terms mentioned
4. Any examples or case studies discussed

Format the response in a clear, student-friendly way. Respond in the same language as the transcription.`

    const { text: summary } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: summaryPrompt,
    })
    console.log("[v0] Summary generated, length:", summary.length)

    errorDetails = "Generating study materials with AI"
    console.log("[v0] Generating study materials with AI")
    const studyMaterialsPrompt = `You are an educational assistant helping teachers create comprehensive study materials.

Based on this lecture transcription, create detailed study materials for students.

Transcription:
${transcription}

Please provide:
1. Detailed notes organized by topic
2. Key takeaways and learning objectives
3. Discussion questions for deeper understanding
4. Suggested areas for further study or research
5. Practice questions or review items (if applicable)

Format the response in a well-structured, comprehensive way that students can use for exam preparation and deeper learning. Respond in the same language as the transcription.`

    const { text: studyMaterials } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: studyMaterialsPrompt,
    })
    console.log("[v0] Study materials generated, length:", studyMaterials.length)

    // Update the recording with transcription and generated content
    errorDetails = "Updating recording in database with results"
    console.log("[v0] Updating recording with results")
    const { error: updateError } = await supabase
      .from("recordings")
      .update({
        transcription,
        summary,
        study_materials: studyMaterials,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordingId)

    if (updateError) {
      console.error("[v0] Failed to update recording:", updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log("[v0] Recording processed successfully")
    return NextResponse.json({ success: true, recordingId })
  } catch (error) {
    console.error("[v0] Error processing recording:", error)
    console.error("[v0] Error occurred at step:", errorDetails)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const fullErrorDetails = `${errorDetails}: ${errorMessage}`

    if (recordingId) {
      try {
        const supabase = await createClient()
        await supabase
          .from("recordings")
          .update({
            status: "failed",
            transcription: `Error: ${fullErrorDetails}`,
          })
          .eq("id", recordingId)
        console.log("[v0] Updated recording status to failed with error details")
      } catch (updateError) {
        console.error("[v0] Failed to update status to failed:", updateError)
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process recording",
        message: errorMessage,
        details: fullErrorDetails,
        step: errorDetails,
      },
      { status: 500 },
    )
  }
}
