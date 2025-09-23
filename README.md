# Career Counseling Chat Application

An AI-powered career counseling chat application built with Next.js, tRPC, and Google Gemini AI. Get personalized career advice, job search guidance, and professional development tips through an intuitive chat interface.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![tRPC](https://img.shields.io/badge/tRPC-11.5-purple)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-Latest-green)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange)

## 🌟 Features

- **AI Career Counselor**: Powered by Google Gemini for intelligent career advice
- **Chat Sessions**: Create and manage multiple conversation sessions
- **Message Persistence**: All conversations saved to PostgreSQL database
- **Session History**: View and continue previous conversations
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Instant message sending with loading states
- **Type-safe API**: End-to-end type safety with tRPC

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.3 (App Router), React 19.1.0, TypeScript
- **Styling**: Tailwind CSS 4.0
- **API Layer**: tRPC with TanStack Query
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **AI Provider**: Google Gemini (gemini-1.5-flash)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (Supabase recommended)
- Google AI Studio API key (free)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/oration-chatapp.git
cd oration-chatapp
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
# Database (Supabase)
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres"

# AI Provider (Google Gemini - FREE!)
GOOGLE_GENERATIVE_AI_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"

# Authentication (if implementing)
BETTER_AUTH_SECRET="generate-random-32-char-string"
BETTER_AUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

5. Push database schema:
```bash
pnpm db:push
```

6. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/trpc/          # tRPC API endpoint
│   └── page.tsx           # Main chat page
├── components/
│   ├── chat/              # Chat UI components
│   └── ui/                # Reusable UI components
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Database schema
│   └── lib/               # Server utilities
└── lib/                   # Client utilities
```

## 🔑 Getting API Keys

### Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (free)
3. Get connection string from Settings → Database

### Google Gemini (AI)
1. Visit [Google AI Studio](https://makersuite.google.com)
2. Sign in with Google account
3. Get API key (free, no credit card)

## 📝 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

## 🎯 Core Functionality

### Chat Features
- Create new chat sessions
- Send messages to AI counselor
- Receive career guidance responses
- View chat history
- Delete sessions
- Continue previous conversations

### AI Capabilities
- Career path recommendations
- Job search strategies
- Resume and interview tips
- Skill development guidance
- Industry insights
- Educational planning

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL`
   - `GOOGLE_GENERATIVE_AI_KEY`
   - `GEMINI_MODEL`
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/oration-chatapp)

## 🔒 Security

- API keys stored in environment variables
- Database connections use SSL
- Input validation with Zod
- SQL injection prevention via Drizzle ORM
- XSS protection built into React

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Database hosted on [Supabase](https://supabase.com)
- Deployed on [Vercel](https://vercel.com)

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ for career development