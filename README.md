# CAYIM — AI Business Mentor

CAYIM helps young entrepreneurs discover, validate, and launch business ideas with AI-powered startup plans, market research, and actionable roadmaps.

## Features

- **AI Mentor Chat** — Conversational onboarding that learns your goals, skills, budget, and interests
- **Startup Plan Generator** — Full 13-tab report: overview, business model, marketing, SWOT, revenue, competitors, 30-day roadmap, and progress tracker
- **My Own Idea** — Describe any business idea and get a complete AI-generated startup plan
- **Idea Vault** — Save and revisit generated startup plans
- **Auth & Profiles** — Email/password auth with avatars, editable profiles, account settings
- **Light & Dark themes** — Mint-green design system with smooth animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo (React Native), Expo Router, Reanimated |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| AI | Google Gemini 2.0 Flash |
| Language | TypeScript |

## Project Structure

```
app/                    # Expo Router screens
  (tabs)/               # Tab navigation (Home, Vault, Profile)
  _layout.tsx           # Root stack layout
  auth.tsx              # Login / signup
  survey.tsx            # 6-question onboarding survey
  mentor.tsx            # AI mentor chat
  my-idea.tsx           # Own-idea input + generation
  loading.tsx           # Animated loading screen
  results.tsx           # 13-tab startup report viewer
  vault.tsx             # Saved ideas
  ...
components/             # Reusable UI (Button, Card, Logo, ReportBits)
hooks/                  # useFrameworkReady
lib/                    # ai.ts, auth.tsx, supabase.ts, theme, reportStore
supabase/
  migrations/           # SQL migrations (schema, conversations, avatars bucket)
  functions/            # Edge functions (generate-startup, mentor-chat)
assets/images/          # App icon + favicon
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project
- A Google Gemini API key

### Install

```bash
npm install
```

### Environment

Create a `.env` file in the project root (this file is gitignored):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Supabase

1. Apply the migrations in `supabase/migrations/` to your Supabase project (via the Supabase MCP tools or Dashboard SQL Editor, in timestamp order).
2. Deploy the edge functions in `supabase/functions/`:
   - `generate-startup` — generates structured startup reports
   - `mentor-chat` — conversational AI mentor
3. Set the `GEMINI_API_KEY` secret in Supabase Edge Functions.
4. Create an `avatars` storage bucket (handled by the avatars migration).

### Run

```bash
npx expo start
```

## License

Private project.
