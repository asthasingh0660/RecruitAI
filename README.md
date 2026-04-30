# RecruitAI - AI-Powered Recruitment Screening

Automate recruitment screening with voice AI. Upload candidates, trigger AI screening calls, and get instant qualification scores.

## 🎯 Features

- 🎤 **AI Voice Screening** - Bolna AI makes screening calls
- 📊 **Auto Scoring** - Candidates automatically scored (0-100)
- 💾 **Candidate Management** - Full CRUD operations
- 📈 **Dashboard** - Real-time metrics and analytics
- 🎯 **Smart Shortlisting** - Kanban board for candidates
- 🔐 **Secure Auth** - Supabase authentication
- 🚀 **Production Ready** - Deployed on Vercel

## 💼 How It Works

1. **Upload Candidates** - Add candidate details manually or via CSV
2. **Trigger AI Call** - One-click to call candidate via Bolna
3. **Auto Screening** - AI asks 8 structured questions
4. **Instant Scoring** - Webhook processes responses, calculates score
5. **Dashboard Update** - Results appear in real-time
6. **Review & Shortlist** - Recruiter reviews and manages candidates

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Voice AI:** Bolna AI API
- **Hosting:** Vercel
- **Charts:** Recharts

## 📋 Database Schema

### candidates table
- id (UUID)
- user_id (FK to users)
- name, phone, email
- experience_years
- tech_stack (array)
- location, notice_period_days
- expected_salary_lpa
- relocation_willing (boolean)
- communication_score (1-10)
- qualification_score (0-100)
- status (pending/qualified/maybe/rejected)
- created_at, updated_at

### calls table
- id (UUID)
- user_id, candidate_id (FK)
- bolna_call_id
- started_at, ended_at
- duration_seconds
- transcript, summary
- call_status (pending/completed/failed/missed)

### users table
- id (UUID, FK to auth.users)
- email
- role (recruiter)
- created_at

## 🎯 Scoring Logic

**For Experienced (1+ years):**
- Experience: 0-50 points
- Tech match (React, Node.js, PostgreSQL): 0-25 points
- Notice period (≤30 days): 0-15 points
- Salary fit (5-15 LPA): 0-10 points
- **Total: ≥70 = Qualified, 50-69 = Maybe, <50 = Rejected**

**For Freshers (0 years):**
- Project quality: 0-40 points
- Tech match: 0-35 points
- Communication: 0-15 points
- Relocation willing: 0-10 points
- **Total: ≥65 = Qualified, 45-64 = Maybe, <45 = Rejected**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Bolna account

### Local Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/RecruitAI.git
cd RecruitAI

# Install dependencies
npm install

# Create .env.local
# Copy from .env.example and fill in your keys:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# NEXT_PUBLIC_BOLNA_API_KEY=
# NEXT_PUBLIC_BOLNA_AGENT_ID=
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Run development server
npm run dev

# Open http://localhost:3000
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then redeploy
vercel --prod
```

## 📱 User Flow

### Recruiter Journey
1. Sign up → Create account
2. Dashboard → See metrics
3. Candidates → Add new candidates
4. Trigger Call → Click "📞 Trigger AI Call"
5. Wait → Bolna calls candidate (3-4 min)
6. Review → See transcript + score
7. Shortlist → Move to Qualified/Maybe/Rejected

### AI Agent Flow
1. Greet candidate
2. Confirm identity
3. Ask about experience
4. Ask about tech stack
5. Ask about notice period
6. Ask about salary
7. Ask about relocation
8. Experience-specific questions (projects or production work)
9. Summarize and thank

## 🎓 Assessment Details

**Built for:** Bolna AI Full Stack Engineer Assessment

**What's Included:**
- Full-stack architecture (frontend, backend, AI, database)
- Prompt engineering (bilingual Bolna agent setup)
- API integration (Bolna API + webhook)
- Real business problem solving
- Production-grade code

**Submission:**
- GitHub repository ✅
- Live Vercel deployment ✅
- Screen recording (user flow demo)
- Architecture diagram

## 🤝 Key Learnings

1. **Voice AI Integration** - Real-time call handling with Bolna
2. **Webhook Processing** - Parse AI responses and score candidates
3. **Full-Stack Development** - Frontend, backend, database, deployment
4. **Database Design** - Proper schema with foreign keys and RLS
5. **TypeScript** - Type-safe React and API development
6. **Authentication** - Secure user management with Supabase

## 📈 Future Enhancements

- [ ] CSV bulk import
- [ ] Email notifications
- [ ] Slack integration
- [ ] Resume parsing with Claude
- [ ] Interview scheduling
- [ ] Salary benchmarking
- [ ] Team collaboration features
- [ ] Custom screening questions UI

## 📝 API Endpoints

- `POST /api/candidates` - Create candidate
- `GET /api/candidates` - List candidates
- `POST /api/calls/trigger` - Trigger screening call
- `POST /api/calls/webhook` - Receive call transcript

## 🔐 Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BOLNA_API_KEY=your_bolna_key
NEXT_PUBLIC_BOLNA_AGENT_ID=your_agent_id
BOLNA_API_KEY=your_bolna_key
BOLNA_AGENT_ID=your_agent_id
NEXT_PUBLIC_APP_URL=your_vercel_url

## 📄 License

MIT - Open source project

## 👤 Author

Your Name

---

**Live Demo:** https://your-vercel-app.vercel.app

**GitHub:** https://github.com/asthasingh0660/RecruitAI