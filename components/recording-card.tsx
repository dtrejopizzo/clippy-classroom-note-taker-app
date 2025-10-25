import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

interface Recording {
  id: string
  title: string
  status: string
  duration_seconds: number | null
  created_at: string
}

interface RecordingCardProps {
  recording: Recording
}

export function RecordingCard({ recording }: RecordingCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        )
      case "recording":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
            Recording
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{recording.title}</CardTitle>
              {getStatusBadge(recording.status)}
            </div>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(recording.duration_seconds)}
              </span>
              <span>{formatDate(recording.created_at)}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild disabled={recording.status !== "completed"}>
          <Link href={`/recordings/${recording.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
