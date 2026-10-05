<div align="center">

# SkillGate

**A job portal with AI resume analysis, mock interview practice and personalised learning plans.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-skillgate--jobs.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://skillgate-jobs.netlify.app)
[![API Health](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://skillgate-fq1v.onrender.com/health)

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

</div>

---

## Overview

SkillGate connects **job seekers** and **recruiters** in one place, and adds an AI layer that helps candidates close their skill gaps:

1. **Analyze** your resume against a target role.
2. **Practice** realistic interview questions and get scored, honest feedback.
3. **Follow** a personalised learning plan built from both results.

> **Live demo:** https://skillgate-jobs.netlify.app
> Register a new account and pick **Job seeker** or **Recruiter** to explore both sides.
> The backend runs on a free tier and sleeps when idle, so the first request after a pause can take up to a minute.

---

## Features

### For job seekers
- Browse and search jobs by keyword, location, company and date posted
- Apply in one click and track every application (Pending, Reviewed, Accepted, Rejected)
- Profile with a completeness score and PDF resume upload
- **AI Resume Analyzer**: match percentage, matched and missing skills, experience summary and recommendations
- **AI Interview Practice**: generated questions, answer scoring, strengths, weaknesses and a model answer
- **AI Learning Plan**: prioritised study topics with concrete steps and a progress checklist

### For recruiters
- Post jobs and manage your postings
- View applicants per job and update their status
- Find candidates

### Platform
- JWT authentication with role-based access (job seeker and recruiter)
- Password reset by emailed one-time link (hashed token, 1-hour expiry, single use)
- Fully responsive UI with a mobile navigation menu
- Weekly cleanup job that keeps the database small

---

## AI features

| Feature | What it does |
|---|---|
| **Resume Analyzer** | Extracts text from an uploaded PDF and scores it against a target role |
| **Interview Practice** | Generates one question at a time, evaluates the answer with a fixed rubric (accuracy, completeness, clarity) and summarises the session |
| **Learning Plan** | Merges the skills missing from your resume with weak points from practice interviews into 3 to 6 prioritised topics, saved per user |

Models run through the [Hugging Face Inference API](https://huggingface.co/docs/inference-providers) using `openai/gpt-oss-120b`. All AI calls happen on the server, so API keys never reach the browser. Model output is validated with Zod, and candidate answers are treated as untrusted input to reduce prompt injection.

```
Resume Analyzer ──► missing skills ─────────────┐
                                                ├──► Learning Plan ──► "Practice this topic"
Interview Practice ──► weak points per skill ───┘            │
        ▲                                                    │
        └────────────────────────────────────────────────────┘
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, TypeScript, Zod, Multer, node-cron |
| Database | PostgreSQL with Prisma ORM |
| AI | Hugging Face Inference (`openai/gpt-oss-120b`) |
| Email | Brevo transactional email API |
| Hosting | Netlify (client), Render (server), Neon (database) |

### Architecture

```mermaid
flowchart LR
  A["React + Tailwind<br/>Netlify"] -- "REST + JWT" --> B["Express API<br/>Render"]
  B --> C[("PostgreSQL<br/>Neon")]
  B --> D["Hugging Face<br/>gpt-oss-120b"]
  B --> E["Brevo<br/>email API"]
```

---

## Screenshots

<!-- Add your images to docs/screenshots/ and keep these filenames, or edit the paths. -->

| Jobs | Dashboard |
|---|---|
| ![Jobs](docs/screenshots/jobs.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Resume Analyzer | Interview Practice |
|---|---|
| ![Resume Analyzer](docs/screenshots/resume-analyzer.png) | ![Interview Practice](docs/screenshots/interview.png) |

| Learning Plan | Login |
|---|---|
| ![Learning Plan](docs/screenshots/learning-plan.png) | ![Login](docs/screenshots/login.png) |

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- A PostgreSQL database (local, or a free one from [Neon](https://neon.tech))
- A [Hugging Face](https://huggingface.co/settings/tokens) access token
- A [Brevo](https://www.brevo.com) API key (optional locally: without it, the password reset link is printed in the server console)

### 1. Clone

```bash
git clone https://github.com/YoteshMishra/skillgate.git
cd skillgate
```

### 2. Server

```bash
cd server
npm install
```

Create `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/skillgate
JWT_SECRET=replace-with-a-long-random-string
HF_TOKEN=your-hugging-face-token
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=your-brevo-api-key
MAIL_FROM_EMAIL=your-verified-sender@example.com
```

Create the tables and start the API:

```bash
npx prisma migrate dev
npm run dev
```

The API runs on `http://localhost:3000`. Check `http://localhost:3000/health`.

### 3. Client

```bash
cd ../client
npm install
npm run dev
```

The app runs on `http://localhost:5173`. It calls `http://localhost:3000/api` by default. To point it elsewhere, create `client/.env`:

```env
VITE_API_URL=https://your-api-host/api
```

> Generate a strong JWT secret with:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## Environment variables

### Server

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `HF_TOKEN` | Hugging Face token for the AI features |
| `CLIENT_URL` | Frontend origin, used for CORS and the password reset link (no trailing slash) |
| `BREVO_API_KEY` | Brevo API key for sending email |
| `MAIL_FROM_EMAIL` | Verified sender address in Brevo |
| `PORT` | Set automatically by most hosts, defaults to `3000` |

### Client

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL ending in `/api`, baked in at build time |

---

## API overview

All routes are prefixed with `/api`. Protected routes need `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Jobs | `GET /jobs`, `GET /jobs/filters`, `GET /jobs/mine`, `POST /jobs` |
| Applications | `POST /applications`, `GET /applications/me`, `GET /applications/job/:id`, `PATCH /applications/:id/status` |
| Profile | `GET /profile/me`, `PUT /profile/me`, `POST /profile/resume` |
| Candidates | `GET /candidates` |
| Resume AI | `POST /ai/analyze-resume` |
| Interview AI | `POST /interview/question`, `POST /interview/evaluate`, `POST /interview/summary` |
| Learning plan | `GET /learning/plan`, `POST /learning/plan` |
| Health | `GET /health` (no `/api` prefix) |

---

## Project structure

```
skillgate/
├── client/
│   ├── public/_redirects        # SPA fallback for Netlify
│   └── src/
│       ├── api/                 # Axios instance (token interceptor)
│       ├── components/          # Navbar, ProtectedRoute
│       ├── pages/               # Login, Dashboard, JobListings, ResumeAnalyzer, ...
│       └── services/            # aiService.ts (AI API calls)
├── server/
│   ├── prisma/                  # schema.prisma and migrations
│   └── src/
│       ├── middleware/          # JWT auth and role guards
│       ├── routes/              # auth, jobs, applications, profile, ai, interview, learning, ...
│       ├── services/            # AI clients, mailer, PDF parsing, cleanup job
│       ├── types/
│       └── index.ts
└── netlify.toml                 # Netlify build settings
```

---

## Deployment

| Part | Service | Notes |
|---|---|---|
| Client | [Netlify](https://www.netlify.com) | Built from `client/` using `netlify.toml`. Set `VITE_API_URL` |
| Server | [Render](https://render.com) | Root directory `server`. Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`. Start: `npm start` |
| Database | [Neon](https://neon.tech) | Use the direct (non-pooled) connection string for Prisma |
| Email | [Brevo](https://www.brevo.com) | HTTPS API, because Render's free tier blocks SMTP ports |

After deploying the client, set the server's `CLIENT_URL` to the exact Netlify URL so CORS and password reset links work.

---

## Security

- Passwords are hashed with bcrypt
- JWT authentication with role-based route protection
- Password reset tokens are stored hashed, expire after one hour and work once
- Forgot-password responses are identical whether or not the email exists, and the endpoint is rate limited
- AI endpoints are rate limited, and inputs are validated with Zod
- Users can only access their own interview attempts, learning plans and resume analyses

---

## Known limitations

- **Free-tier hosting:** the API sleeps when idle, so the first request can be slow.
- **Resume file storage:** uploaded PDFs are saved on the server disk, which is wiped on redeploy on Render's free tier. Moving uploads to object storage (Cloudinary, S3 or Supabase Storage) is planned.
- **Email deliverability:** mail is sent from a personal address, so messages may land in spam. A custom domain with Brevo authentication would fix this.
- **AI output varies:** scores are advisory and can differ slightly between runs.

---

## Roadmap

- [ ] Match score on every job card
- [ ] AI job description writer for recruiters
- [ ] Applicant ranking with reasons (advisory only)
- [ ] Resume autofill for the profile
- [ ] Semantic job and candidate search
- [ ] Persistent resume storage
- [ ] Skill assessments (MCQ and coding)
- [ ] Custom domain for reliable email delivery

---

## Author

**Yotesh Kumar**, Frontend Developer

[![GitHub](https://img.shields.io/badge/GitHub-YoteshMishra-181717?style=flat-square&logo=github)](https://github.com/YoteshMishra)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Yotesh%20Kumar-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/yotesh-kumar-754545161/)
[![X](https://img.shields.io/badge/X-@MishraYotesh-000000?style=flat-square&logo=x)](https://x.com/MishraYotesh)

---

## License

ISC