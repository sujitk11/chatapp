# Career Counseling Chat Application

AI-powered career counseling chat built with Next.js and Google Gemini AI.

## Features

- 🤖 AI career counselor powered by Google Gemini
- 💬 Multiple chat sessions with history
- 🔐 User authentication (register/login)
- 🌓 Dark/light theme
- 📱 Responsive design
- ⚡ Real-time streaming responses

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript, Tailwind CSS 4
- **Backend**: tRPC, PostgreSQL (Supabase), Drizzle ORM
- **AI**: Google Gemini AI (gemini-2.5-flash)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (use Supabase free tier)
- Google Gemini API key (free)

### Installation

1. Clone the repo
```bash
git clone <repo-url>
cd oration-chatapp
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
GOOGLE_GENERATIVE_AI_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
AUTH_SECRET="random-32-char-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Push database schema
```bash
pnpm db:push
```

5. Run development server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Getting API Keys

### Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Create free project
3. Get connection string from Settings → Database

### Google Gemini (AI)
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in and get API key (free, no credit card)

## Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── chat/        # Chat UI components
│   └── ui/          # Reusable UI components
├── server/          # Backend
│   ├── api/         # tRPC routers
│   ├── db/          # Database schema
│   └── lib/         # AI integration
└── lib/             # Utilities
```

## Scripts

```bash
pnpm dev        # Start development
pnpm build      # Build for production
pnpm start      # Start production server
pnpm db:push    # Update database schema
```

## License

MIT

---