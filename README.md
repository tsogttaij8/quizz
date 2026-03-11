# Quizz AI

Quizz AI is a Next.js study assistant that turns long-form reading material into short summaries and multiple-choice quizzes. Users sign in with Clerk, save generated study items to PostgreSQL with Prisma, and revisit past content from the sidebar.

## Stack

- Next.js 16 App Router
- React 19
- Clerk authentication
- Prisma with PostgreSQL
- Google Gemini API
- Tailwind CSS and shadcn/ui

## Features

- Sign in and manage a personal study workspace
- Paste article or lesson content and generate an AI summary
- Save summaries to the database
- Generate quiz questions from saved content
- Open saved history and retake quizzes

## Environment Variables

Create a `.env` file with these values:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
GEMINI_API_KEY=
DATABASE_URL=
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Apply database migrations:

```bash
npx prisma migrate deploy
```

4. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment Checklist

1. Add every environment variable in your hosting provider.
2. Point `DATABASE_URL` to your production PostgreSQL database.
3. Run Prisma migrations in production.
4. Add the Clerk webhook endpoint:

```text
https://your-domain.com/api/webhooks/clerk
```

5. Test sign-in, summary generation, quiz generation, and history loading after deploy.

## Notes

- Do not commit real API keys or database credentials.
- If you rotate Clerk or Gemini keys, update them in both local `.env` and production settings.
