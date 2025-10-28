import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { answerQuestion } from "@/lib/rag/qa-chain"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting ask-question API")

    const { courseId, question } = await request.json()

    if (!courseId || !question) {
      return NextResponse.json({ error: "Missing courseId or question" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this course
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 })
    }

    console.log("[v0] Processing question:", question)

    // Use RAG to answer the question
    const result = await answerQuestion(courseId, question)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error answering question:", error)
    return NextResponse.json(
      {
        error: "Failed to answer question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
