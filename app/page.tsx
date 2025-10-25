import { Button } from "@/components/ui/button"
import { BookOpen, Mic, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mic className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Clippy</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Classroom Assistant
            </div>
            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              The Teacher's Memory
            </h1>
            <p className="text-pretty text-xl text-muted-foreground leading-relaxed">
              Record your lectures, get instant transcriptions, and generate comprehensive study materials for your
              students. Clippy remembers everything so you can focus on teaching.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/auth/signup">Start recording for free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Easy Recording</h3>
              <p className="text-muted-foreground leading-relaxed">
                One-click recording with no time limits. Capture every moment of your lecture effortlessly.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Transcription</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatic transcription and intelligent summaries powered by advanced AI technology.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Study Materials</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate comprehensive notes and study guides for your students automatically.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Clippy. Built for teachers who care about their students.</p>
        </div>
      </footer>
    </div>
  )
}
