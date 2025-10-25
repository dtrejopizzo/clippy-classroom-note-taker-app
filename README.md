# 📚 Clippy - The Teacher's Memory

Clippy is an AI-powered classroom recording and note-taking tool designed to help teachers capture, transcribe, and transform their lectures into comprehensive study materials. Record your classes, get automatic transcriptions, AI-generated summaries, and downloadable presentations—all in one seamless platform.

## ✨ Features

### 🎙️ Audio Recording
- **Unlimited recording duration** - Record entire lectures without time constraints
- **Pause and resume** - Take breaks during recording without losing your progress
- **Audio preview** - Listen to your recording before saving
- **Browser-based recording** - No additional software required

### 🤖 AI-Powered Processing
- **Automatic transcription** - Powered by Groq's Whisper API for accurate speech-to-text
- **Multi-language support** - Transcribes in Spanish, English, and other languages
- **AI-generated summaries** - Get concise summaries of your entire lecture
- **Study materials generation** - Automatically creates comprehensive study guides

### 🌍 Multi-language Translation
- **Powered by Lingo.dev** - Translate content to 8+ languages
- **Real-time translation** - Switch languages on-the-fly
- **Automatic language detection** - Detects browser language preferences
- **Supported languages**: English, Spanish, French, German, Portuguese, Italian, Chinese, Japanese

### 📊 Presentation Generator
- **Automatic slide creation** - Converts summaries into PowerPoint presentations
- **Smart content distribution** - Prevents slide overflow by intelligently splitting content
- **Professional formatting** - Clean, readable slides with proper typography
- **Download as .pptx** - Compatible with PowerPoint and Google Slides

### 📁 Course Management
- **Organize by courses** - Create and manage multiple courses
- **Recording history** - View all recordings per course
- **Easy navigation** - Intuitive dashboard for quick access

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components
- **PptxGenJS** - PowerPoint generation library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database and authentication
- **Supabase Storage** - Audio file storage

### AI & Integrations
- **Groq Whisper API** - Audio transcription
- **OpenAI GPT-4o-mini** - Content generation (via Vercel AI Gateway)
- **Lingo.dev** - Multi-language translation
- **Vercel AI SDK** - AI integration framework

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun** installed
- A **Supabase** account and project
- A **Groq** API key (free tier available)
- A **Lingo.dev** API key (optional, for translations)
- A **Vercel** account (for deployment)

## 🚀 Installation

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/yourusername/clippy.git
cd clippy
\`\`\`

### 2. Install dependencies

\`\`\`bash
# Using npm
npm install

# Using bun
bun install
\`\`\`

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Auth Redirect (for development)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Groq API (for transcription)
GROQ_API_KEY=your_groq_api_key

# Lingo.dev (optional, for translations)
LINGODOTDEV_API_KEY=your_lingo_api_key
\`\`\`

### 4. Set up the database

Run the SQL scripts in order to create the necessary tables and policies:

\`\`\`bash
# Execute these scripts in your Supabase SQL Editor
# or run them programmatically if you have the Supabase CLI

1. scripts/001_create_tables.sql
2. scripts/002_profile_trigger.sql
3. scripts/003_create_storage_bucket.sql
\`\`\`

**What these scripts do:**
- Create `profiles`, `courses`, and `recordings` tables
- Set up Row Level Security (RLS) policies
- Create automatic profile creation trigger
- Set up storage bucket for audio files

### 5. Run the development server

\`\`\`bash
# Using npm
npm run dev

# Using bun
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

### Tables

#### `profiles`
- `id` (uuid, primary key) - References auth.users
- `email` (text)
- `full_name` (text)
- `created_at` (timestamp)

#### `courses`
- `id` (uuid, primary key)
- `user_id` (uuid) - References profiles
- `name` (text)
- `description` (text)
- `created_at` (timestamp)

#### `recordings`
- `id` (uuid, primary key)
- `course_id` (uuid) - References courses
- `user_id` (uuid) - References profiles
- `title` (text)
- `audio_url` (text) - Supabase Storage URL
- `transcription` (text) - AI-generated transcription
- `summary` (text) - AI-generated summary
- `study_materials` (text) - AI-generated study materials
- `status` (text) - 'processing', 'completed', 'failed'
- `duration` (integer) - Recording duration in seconds
- `created_at` (timestamp)

## 📖 How to Use

### 1. Sign Up / Login
- Create an account or log in with your email and password
- Email verification is required for new accounts

### 2. Create a Course
- From the dashboard, click "Create New Course"
- Enter course name and description
- Click "Create Course"

### 3. Record a Lecture
- Navigate to a course
- Click "Start New Recording"
- Allow microphone permissions when prompted
- Click the record button to start recording
- Use pause/resume as needed during the lecture
- Click stop when finished
- Preview the audio and enter a title
- Click "Save Recording"

### 4. View Results
- The recording will be automatically processed (transcription + AI analysis)
- Processing typically takes 30-60 seconds depending on audio length
- Once complete, you'll see three tabs:
  - **Summary**: AI-generated overview with key points
  - **Transcript**: Full transcription of the lecture
  - **Study Materials**: Download as PowerPoint presentation

### 5. Translate Content (Optional)
- Use the language switcher to translate content
- Supports 8+ languages
- Translations are cached for faster subsequent access

### 6. Download Presentation
- Go to the "Study Materials" tab
- Click "Generate Presentation"
- Download the .pptx file
- Open in PowerPoint or upload to Google Slides

## 📁 Project Structure

\`\`\`
clippy/
├── app/
│   ├── api/
│   │   ├── process-recording/    # Audio processing endpoint
│   │   └── translate/             # Translation endpoint
│   ├── auth/
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Sign up page
│   │   └── verify-email/          # Email verification page
│   ├── courses/
│   │   └── [id]/
│   │       ├── page.tsx           # Course detail page
│   │       └── record/            # Recording interface
│   ├── dashboard/                 # Main dashboard
│   ├── recordings/
│   │   └── [id]/                  # Recording detail page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── audio-recorder.tsx         # Audio recording component
│   ├── create-course-dialog.tsx   # Course creation dialog
│   ├── language-switcher.tsx      # Language selector
│   ├── markdown-renderer.tsx      # Markdown to HTML renderer
│   ├── presentation-generator.tsx # PowerPoint generator
│   ├── recording-card.tsx         # Recording list item
│   ├── start-recording-button.tsx # Recording button
│   └── translated-content.tsx     # Translation wrapper
├── lib/
│   ├── lingo/
│   │   └── server.ts              # Lingo.dev server client
│   ├── supabase/
│   │   ├── client.ts              # Supabase browser client
│   │   ├── server.ts              # Supabase server client
│   │   └── middleware.ts          # Auth middleware
│   └── utils.ts                   # Utility functions
├── scripts/
│   ├── 001_create_tables.sql      # Database schema
│   ├── 002_profile_trigger.sql    # Auto-profile creation
│   └── 003_create_storage_bucket.sql # Storage setup
└── middleware.ts                  # Next.js middleware
\`\`\`

## 🔑 API Keys Setup

### Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys
4. Create a new API key
5. Add to `.env.local` as `GROQ_API_KEY`

### Lingo.dev API Key (Optional)
1. Go to [lingo.dev](https://lingo.dev)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Add to `.env.local` as `LINGODOTDEV_API_KEY`

### Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy the Project URL and anon/public key
4. Go to Project Settings → Database → Connection String
5. Copy the service role key (keep this secret!)
6. Add all keys to `.env.local`

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy!

\`\`\`bash
# Or use Vercel CLI
vercel --prod
\`\`\`

### Important Notes
- Make sure all environment variables are set in Vercel
- Supabase RLS policies must be properly configured
- Test the microphone permissions on your deployed domain

## 🔒 Security

- **Row Level Security (RLS)** - All database tables have RLS policies
- **Authentication required** - All routes except landing/auth are protected
- **Secure API keys** - Service role keys are only used server-side
- **File access control** - Storage bucket has proper access policies

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - For the amazing Whisper API
- **Supabase** - For the backend infrastructure
- **Vercel** - For hosting and AI SDK
- **Lingo.dev** - For translation capabilities
- **shadcn/ui** - For beautiful UI components

## 📧 Support

For support, email support@clippy.dev or open an issue on GitHub.

---

Made with ❤️ for teachers everywhere
