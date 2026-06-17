# PHC America 250 — Spirit Week App

Employee engagement app for Hospital District No. 6 celebrating America's 250th anniversary.
Spirit Week: June 29 – July 3, 2026 · Prize drawing: July 6, 2026

---

## Features

- **Email OTP login** — PHC email verification, no passwords
- **Daily trivia** — 3 questions per day (easy → medium → hard), +1 entry per correct answer
- **Spirit Week** — daily themes with JotForm photo submission, +1 entry per day
- **Bingo** — unique seeded board per employee, +3 for bingo, +10 for blackout
- **Photo contest** — JotForm upload with HIPAA confirmation, admin approval queue, voting
- **Leaderboard** — top 10 with entry counts, countdown to drawing
- **Admin panel** — photo approval, entry export CSV for drawing (/admin)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd america250
npm install
```

### 2. Create Airtable base

Create a new Airtable base with these tables:

**Members**
- Email (Single line text)
- Name (Single line text)
- Location (Single line text)
- Department (Single line text)
- Verified (Checkbox)
- EntriesTotal (Number)
- CreatedAt (Single line text)

**OTPCodes**
- Email (Single line text)
- Code (Single line text)
- ExpiresAt (Single line text)
- Used (Checkbox)

**TriviaQuestions**
- Date (Single line text — YYYY-MM-DD format)
- Question (Long text)
- OptionA (Single line text)
- OptionB (Single line text)
- OptionC (Single line text)
- OptionD (Single line text)
- CorrectAnswer (Single line text — A, B, C, or D)
- Difficulty (Number — 1, 2, or 3)

**TriviaAnswers**
- MemberEmail (Single line text)
- QuestionID (Single line text)
- Correct (Checkbox)
- Date (Single line text)

**BingoBoards**
- MemberEmail (Single line text)
- Squares (Long text — JSON array)
- Marked (Long text — JSON array of indices)

**BingoCompletions**
- MemberEmail (Single line text)
- Type (Single line text — "bingo" or "blackout")
- AwardedEntries (Number)
- AwardedAt (Single line text)

**SpiritSubmissions**
- MemberEmail (Single line text)
- Date (Single line text)
- JotFormSubmissionID (Single line text)
- SubmittedAt (Single line text)

**PhotoSubmissions**
- MemberEmail (Single line text)
- MemberName (Single line text)
- Location (Single line text)
- JotFormSubmissionID (Single line text)
- Category (Single line text)
- PhotoURL (Single line text)
- Status (Single line text — "pending", "approved", or "rejected")
- Votes (Number)
- SubmittedAt (Single line text)

**PhotoVotes**
- MemberEmail (Single line text)
- PhotoID (Single line text)

### 3. Load trivia questions into Airtable

The trivia bank is in `lib/content.js`. You can:
- Manually enter them in Airtable, OR
- Build a small import script using the Airtable API

You can edit/add questions anytime in Airtable — changes take effect immediately.

### 4. Create JotForms

**Spirit Week Photo Form** (JOTFORM_SPIRIT_ID):
- Hidden fields: email, date, theme (pre-filled via URL params)
- File upload: "Upload your spirit week photo"
- Submit button

**Photo Contest Form** (JOTFORM_PHOTO_ID):
- Hidden fields: email, category (pre-filled via URL params)
- File upload: "Upload your contest photo"
- Note: photos are stored in JotForm; add webhook to notify on submission

### 5. Set up Resend

1. Create account at resend.com (free tier is fine)
2. Add domain: pattersonhc.org
3. Copy the TXT record value for the next step
4. Verify domain in Resend

### 6. Add DNS records in GoDaddy

Go to GoDaddy → My Products → DNS → Add New Record:

**Resend email verification (so OTP emails send from your domain):**
| Type | Name | Value |
|------|------|-------|
| TXT | resend._domainkey | (value from Resend dashboard) |

**Vercel subdomain (so america250.pattersonhc.org loads the app):**
| Type | Name | Value |
|------|------|-------|
| CNAME | america250 | cname.vercel-dns.com |

DNS propagation typically takes a few minutes to an hour.

### 7. Deploy to Vercel

1. Push code to GitHub
2. Import repo in Vercel dashboard
3. Add environment variables (see below)
4. Add custom domain: america250.pattersonhc.org

### 8. Environment variables

Copy `.env.local.example` to `.env.local` for local dev.
In Vercel: Settings → Environment Variables — add all of these:

```
AIRTABLE_PAT=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id
RESEND_API_KEY=your_resend_api_key
AUTH_SECRET=run "openssl rand -base64 32" to generate
ADMIN_EMAIL=info@pattersonhc.org
JOTFORM_SPIRIT_ID=your_spirit_jotform_id
JOTFORM_PHOTO_ID=your_photo_jotform_id
NEXT_PUBLIC_APP_URL=https://america250.pattersonhc.org
NEXT_PUBLIC_JOTFORM_SPIRIT_ID=your_spirit_jotform_id
NEXT_PUBLIC_JOTFORM_PHOTO_ID=your_photo_jotform_id
```

---

## Admin panel

Visit `/admin` — only accessible when logged in as info@pattersonhc.org.

- **Pending Photos** — approve or reject submitted photos before they go live
- **Approved Photos** — view live gallery
- **All Entries** — full participant list with entry counts; export CSV for prize drawing

---

## Entry earning summary

| Activity | Entries |
|----------|---------|
| Correct trivia answer | +1 (up to +3/day) |
| Spirit week photo | +1/day (up to +5/week) |
| Bingo (row/col/diagonal) | +3 (once) |
| Bingo blackout | +10 (once) |
| Photo contest submission | +1 (once) |
| **Max possible** | **~39** |

---

## Spirit Week Schedule

| Date | Theme |
|------|-------|
| Mon June 29 | Red, White & Blue Day |
| Tue June 30 | Decade of America Day |
| Wed July 1 | Patriotic Hats & Accessories Day |
| Thu July 2 | Vintage Americana / Denim & Flannel Day |
| Fri July 3 | Stars & Stripes Everything — Full Costume Day! |

Prize drawing: July 6, 2026
