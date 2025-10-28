import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { retrieveRelevantChunks } from "./retriever"

const QA_TEMPLATE = `You are an AI teaching assistant for a course. Answer the student's question based on the course materials provided below.

Course Materials:
{context}

Student Question: {question}

Instructions:
- Answer the question directly and clearly
- Use information from the course materials provided
- If the answer isn't in the materials, say "I don't have enough information in the course materials to answer that question."
- Be concise but thorough
- Use examples from the materials when relevant
- Respond in the same language as the question

Answer:`

export async function answerQuestion(courseId: string, question: string) {
  console.log("[v0] Answering question for course:", courseId)

  // Retrieve relevant chunks
  const relevantChunks = await retrieveRelevantChunks(courseId, question, 5)

  if (!relevantChunks || relevantChunks.length === 0) {
    return {
      answer:
        "I don't have any course materials to reference yet. Please make sure recordings or materials have been uploaded and processed.",
      sources: [],
    }
  }

  // Build context from chunks
  const context = relevantChunks.map((chunk: any, idx: number) => `[${idx + 1}] ${chunk.chunk_text}`).join("\n\n")

  console.log("[v0] Context built from", relevantChunks.length, "chunks")

  // Create the prompt
  const prompt = PromptTemplate.fromTemplate(QA_TEMPLATE)

  // Create the LLM
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
    temperature: 0.3,
  })

  // Create the chain
  const chain = prompt.pipe(model).pipe(new StringOutputParser())

  // Run the chain
  console.log("[v0] Running QA chain")
  const answer = await chain.invoke({
    context,
    question,
  })

  console.log("[v0] Answer generated")

  // Return answer with sources
  return {
    answer,
    sources: relevantChunks.map((chunk: any) => ({
      sourceType: chunk.source_type,
      sourceId: chunk.source_id,
      text: chunk.chunk_text.substring(0, 200) + "...",
      metadata: chunk.metadata,
    })),
  }
}
