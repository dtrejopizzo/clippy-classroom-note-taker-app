"use client"

import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { useRouter } from "next/navigation"

interface StartRecordingButtonProps {
  courseId: string
}

export function StartRecordingButton({ courseId }: StartRecordingButtonProps) {
  const router = useRouter()

  const handleStartRecording = () => {
    router.push(`/courses/${courseId}/record`)
  }

  return (
    <Button onClick={handleStartRecording}>
      <Mic className="mr-2 h-4 w-4" />
      Start Recording
    </Button>
  )
}
