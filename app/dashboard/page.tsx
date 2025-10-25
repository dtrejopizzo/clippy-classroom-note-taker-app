import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, LogOut } from "lucide-react"
import Link from "next/link"
import { CreateCourseDialog } from "@/components/create-course-dialog"
import { DeleteCourseButton } from "@/components/delete-course-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*, recordings(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Clippy</h1>
              <p className="text-xs text-muted-foreground">The Teacher's Memory</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || "Teacher"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <form action={handleSignOut}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Courses</h2>
            <p className="text-muted-foreground mt-1">Manage your courses and recordings</p>
          </div>
          <CreateCourseDialog />
        </div>

        {!courses || courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No courses yet</h3>
              <p className="mb-6 text-center text-muted-foreground max-w-sm">
                Create your first course to start recording and organizing your classroom lectures.
              </p>
              <CreateCourseDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{course.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.recordings?.[0]?.count || 0} recordings</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/courses/${course.id}`}>Open course</Link>
                    </Button>
                    <DeleteCourseButton courseId={course.id} courseName={course.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
