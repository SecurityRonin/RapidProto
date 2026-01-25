# RapidProto: Builder Rundown

**From discovery to demo in 50 minutes**

**📖 Complete Template Catalog:** See `TEMPLATES.md` for all 25 pre-built templates with detailed specs, schemas, and AI features.

## Pre-Session Setup (Do This Once)

### Template Arsenal

**Opinionated Stack (All Templates):**
- Next.js 14 + TypeScript
- Clerk (Auth) - 5-min setup
- Turso (Database) - SQLite at edge
- Vercel AI Gateway (NO BYOK!)
- Resend (Email)
- Vercel Blob (Files)
- shadcn/ui + Tailwind CSS

**25 Pre-Built Templates Ready to Clone:**

#### Financial Management (1-2)
1. **Expense Tracker** - Personal/business expense tracking with categories
2. **Invoice Generator** - Create, send, track invoices with payment status

#### Time & Resource Management (3-5)
3. **Meeting Scheduler** - Availability matching + calendar integration
4. **Project Time Tracker** - Billable hours, task tracking, reports
5. **Resource Booking** - Equipment, rooms, vehicle reservations

#### Workflow Automation (6-7)
6. **Approval Workflow** - Multi-stage approvals with notifications
7. **Document Generator** - Template-based PDF/Word generation

#### CRM & Customer Management (8-9)
8. **Lead Tracking** - Sales pipeline, contact management
9. **Customer Feedback** - Surveys, NPS, feature requests

#### Data & Analytics (10-11)
10. **KPI Dashboard** - Real-time metrics with charts
11. **Report Builder** - Custom reports with scheduling

#### HR & People Management (12-13)
12. **Employee Onboarding** - Checklists, document collection
13. **Leave Management** - PTO requests, approval, balance tracking

#### Operations & Logistics (14-15)
14. **Inventory Management** - Stock tracking, reorder alerts
15. **Vendor Management** - Vendor info, contracts, performance

#### Professional Services (16-20) ⭐ NEW
16. **Client Intake & Onboarding** ✅ BUILT - Intake forms, conflict checks, AI doc extraction
17. **Matter & Case Management** - Case tracking, deadlines, team collaboration
18. **Billable Hours & Invoicing** - Time tracking, expense management, invoicing
19. **Client Portal & Communication** - Secure messaging, document sharing
20. **CPE/CLE Tracking** - Continuing education credits, compliance

#### Schools & Education (21-25) ⭐ NEW
21. **Student Enrollment** - Online enrollment, guardian info, document upload
22. **Attendance Tracking** - Roll call, absence management, truancy alerts
23. **Grade Management** - Assignments, grading, report cards, GPA
24. **Parent-Teacher Communication** - Messaging, conferences, announcements
25. **Assignment Submission** - File uploads, rubric grading, plagiarism detection

**Template Selection Matrix:**

| Problem Type | Template # | Build Time | Complexity |
|--------------|-----------|------------|------------|
| Financial tracking | 1, 2 | 20-25 min | ⭐ |
| Scheduling/booking | 3, 5 | 25-30 min | ⭐⭐ |
| Time/task tracking | 4, 18 | 25-30 min | ⭐⭐ |
| Approvals/workflows | 6 | 30 min | ⭐⭐⭐ |
| Document generation | 7 | 20-25 min | ⭐⭐ |
| CRM/sales | 8, 9 | 25-30 min | ⭐⭐ |
| Analytics/dashboards | 10, 11 | 25-30 min | ⭐⭐⭐ |
| HR/onboarding | 12, 13, 16 | 25-30 min | ⭐⭐ |
| Inventory/operations | 14, 15 | 25-30 min | ⭐⭐ |
| Professional services | 16-20 | 30 min | ⭐⭐⭐ |
| Education/schools | 21-25 | 20-30 min | ⭐⭐ |

### Deployment Accounts
- ✅ Vercel account configured with CLI
- ✅ Supabase project templates ready
- ✅ GitHub repo access for quick clones
- ✅ Environment variables template file
- ✅ Railway/Render backup if needed

### Dev Environment
- Two monitors (code + communication)
- Terminal with preset aliases
- Quick-access to API docs (Stripe, Twilio, etc.)
- Code snippets library for common patterns

---

## Session Timeline: Builder's Perspective

### Minutes 0-10: PROBLEM INTAKE (With Facilitator)

**Your Role: Listen & Assess**

Take notes on:
- [ ] Core data structure (what entities?)
- [ ] Key user action (what do they DO?)
- [ ] Success metric (what proves it works?)
- [ ] Integration points (external APIs?)
- [ ] Technical constraints mentioned

**Mental Template Selection:**

See `TEMPLATES.md` for complete catalog. Quick reference:

```
Financial tracking → #1 Expense Tracker, #2 Invoice Generator
Scheduling/booking → #3 Meeting Scheduler, #5 Resource Booking
Time tracking → #4 Project Tracker, #18 Billable Hours
Approvals → #6 Approval Workflow
Documents → #7 Document Generator
CRM/Sales → #8 Lead Tracking, #9 Customer Feedback
Analytics → #10 KPI Dashboard, #11 Report Builder
HR/Onboarding → #12 Employee Onboarding, #13 Leave Management
Inventory → #14 Inventory Management
Vendors → #15 Vendor Management
Professional Services → #16 Client Intake ✅, #17-20
Education → #21-25
```

**Quick Risk Assessment:**
- 🟢 Green: Standard pattern, template exists
- 🟡 Yellow: Need custom logic, doable in 30 min
- 🔴 Red: Complex integration, might need 45 min or async approach

**Communication to Facilitator:**
Send quick Slack message:
```
"Got it. Using [template].
Need sample data for [specific field].
Ask them about [edge case]."
```

---

### Minutes 10-12: RAPID SETUP

**2-Minute Deploy Checklist:**

```bash
# 1. Clone template (30 sec)
git clone https://github.com/yourorg/template-name client-project-name
cd client-project-name

# 2. Environment setup (30 sec)
cp .env.example .env
# Update project name in package.json/config

# 3. Initial deploy (60 sec)
vercel --prod
# or: git push (if auto-deploy configured)
```

**Slack Facilitator:**
```
"✅ Skeleton deployed: [staging-url]
Starting core logic now."
```

---

### Minutes 12-25: CORE BUILD

**The Critical 13 Minutes**

#### Minute-by-Minute Focus:

**12-15: Data Model**
- Define types/interfaces
- Set up database schema (if needed)
- Create sample data structure

**15-20: Core Business Logic**
- The unique algorithm/processing
- This is the ONLY custom code
- Everything else is template

**20-23: Connect the Dots**
- Wire up API routes
- Connect UI to backend
- Handle basic errors

**23-25: Polish & Deploy**
- Remove debug code
- Add loading states
- Final deployment

#### Communication Protocol:

**Send updates every 5 minutes:**

```
Min 15: "Core logic working locally.
        Need to confirm: [business rule question]"

Min 20: "Deployed to staging. Testing with sample data."

Min 25: "✅ Ready for demo. Works with their [format/requirement]."
```

#### When Things Go Wrong:

**If stuck for >3 minutes:**

Option 1: **Pivot**
- Simplify the feature
- Mock the integration
- Show proof-of-concept vs. working version

Option 2: **Ask for Time**
```
Slack to Facilitator:
"Need 5 more minutes for [X].
Can you extend the discussion phase?"
```

Option 3: **Demo What Works**
```
"API integration isn't live yet, but I'll show
the UI and explain the backend approach."
```

---

### Minutes 25-30: PRE-DEMO PREP

**5-Minute Launch Checklist:**

- [ ] App deployed and accessible
- [ ] Test with sample data (their format if possible)
- [ ] Prepare 2-3 demo scenarios
- [ ] Verify edge cases don't crash
- [ ] Open app in clean browser tab
- [ ] Screenshot backup if live demo might fail

**Prepare Demo Flow:**

1. **Happy path**: Standard use case works
2. **Edge case**: Show it handles their specific concern
3. **Future state**: Mention what 2-3 hours more would add

**Create Quick Demo Script:**
```
1. Show data upload/input screen
2. Demonstrate processing/calculation
3. Display results/output
4. Point out [specific feature they asked for]
```

**Slack Facilitator:**
```
"🚀 Demo ready.
Happy path: [describe]
Edge case covered: [describe]
Known limitation: [describe]

Ready when you are."
```

---

### Minutes 30-40: DEMO TIME

**Your Role: Technical Narrator**

**Let Facilitator Lead**, but jump in for:

1. **Technical Explanations**
   - "Here's how it matches the invoice numbers..."
   - "This algorithm handles duplicates by..."

2. **Live Interactions**
   - Let client upload their file
   - Walk through the processing
   - Show the output

3. **Code Glimpses** (if technical client)
   - Show 5-10 lines of key logic
   - Explain the approach
   - Demonstrate quality

**Handle Questions:**

❓ "Can it do [X]?"
✅ "Yes, that's a 2-hour add"
✅ "Not currently, but here's how we'd approach it..."
✅ "Let me show you in the code where that would go"

❓ "What if [edge case]?"
✅ [Test it live if possible]
✅ "Good catch. We'd add validation for that in production."

❓ "Is this production-ready?"
✅ "This is a proof-of-concept. Production needs:
   - Authentication/security
   - Error handling
   - Performance optimization
   - Testing
   Estimate: [X hours/days]"

---

### Minutes 40-50: NEXT STEPS DISCUSSION

**Your Role: Technical Scoping**

**Answer:**
1. What's missing for production?
2. How long would it take?
3. What's the tech stack decision?

**Framework:**

```markdown
## Production Roadmap

### Phase 1: Core Completion (X hours)
- [ ] Full error handling
- [ ] Input validation
- [ ] User authentication
- [ ] Basic logging

### Phase 2: Production Hardening (X hours)
- [ ] Database optimization
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation

### Phase 3: Nice-to-Haves (X hours)
- [ ] Advanced features
- [ ] Integrations
- [ ] Analytics
- [ ] Mobile responsive

**Total Estimate: X-Y days**
**Cost Range: $X-Y (if discussing pricing)**
```

**Take Notes:**
- Technical requirements mentioned
- Integration priorities
- Timeline constraints
- Budget signals

---

## Communication Templates

### To Facilitator (During Build)

**Status Updates:**
```
✅ On track - [what's working]
⚠️ Need clarification - [question]
🔧 Technical blocker - [issue, ETA]
🚀 Ready for demo
```

**Questions to Ask Client:**
```
"Can you ask them:
- What format is their [data] in?
- Do they need [feature X] or can we skip?
- Should we prioritize [A] or [B]?"
```

**Time Requests:**
```
"Can you extend discovery by 5 min?
I need time to [specific task]."
```

### To Client (During Demo)

**Setting Expectations:**
```
"What you're seeing is a proof-of-concept built in 30 minutes.
It demonstrates [core value], but isn't production-ready.

Production would need:
- Security/auth
- Error handling
- Performance optimization
- [Their specific requirement]"
```

**Showcasing Technical Approach:**
```
"The interesting part technically is [X].
We're using [technology] because [reason].
This gives us [benefit]."
```

---

## Technical Playbook by Problem Type

### Data Dashboard
**Template:** dashboard-analytics
**Core Work:** Data aggregation logic + chart config
**Time Sinks:** Data cleaning (prepare scripts)
**Demo Win:** Live filtering and real-time updates

### Form Workflow
**Template:** form-workflow
**Core Work:** Validation rules + submission handler
**Time Sinks:** Multi-step state management (use library)
**Demo Win:** Submit test form, show in database

### Data Transformer
**Template:** data-transformer
**Core Work:** Parser for their file format + transformation logic
**Time Sinks:** Edge cases in data (show error handling)
**Demo Win:** Upload their actual file, download result

### AI/Chat Assistant
**Template:** chat-assistant
**Core Work:** Prompt engineering + context setup
**Time Sinks:** API rate limits (have backup API keys)
**Demo Win:** Ask domain-specific question, get accurate answer

### CRUD Admin
**Template:** crud-admin
**Core Work:** Database schema + API routes
**Time Sinks:** Relationship mapping (start simple)
**Demo Win:** Create, edit, delete records live

### API Integration
**Template:** api-integrator
**Core Work:** Auth flow + data transformation
**Time Sinks:** API docs reading (pre-read common APIs)
**Demo Win:** Show live data from external service

---

## Troubleshooting Guide

### "Deployment Failing"
```bash
# Fallback 1: Local with ngrok
npm run dev
ngrok http 3000
# Share ngrok URL for demo

# Fallback 2: Quick deploy
surge ./dist  # for static
# or Railway/Render one-click deploy
```

### "Data Format Doesn't Match"
```javascript
// Quick adapter function
function adaptData(theirFormat) {
  return {
    id: theirFormat.ID || theirFormat.id,
    name: theirFormat.NAME || theirFormat.name,
    // ... map fields
  }
}
```

### "Running Out of Time"
**Priority Stack:**
1. ✅ Core demo works (fake data OK)
2. ✅ Deployed somewhere accessible
3. ⚠️ Works with their data format
4. ⚠️ Error handling
5. ❌ Polish/styling
6. ❌ Edge cases

**Cut ruthlessly:**
- Skip auth (show mockup)
- Skip validation (mention it)
- Skip styling (functional > pretty)
- Mock integrations (show flow, not live API)

### "They Asked for Something Impossible"
**Response Framework:**
```
"That's a great feature idea.
For this 30-minute demo, I focused on [core value].
Adding [their request] would take [realistic time estimate].

I can either:
A) Show you what we have and discuss adding it next
B) Take 10 more minutes to add a basic version
C) Schedule a follow-up where I build it properly

What's most valuable to you?"
```

---

## Post-Session Checklist

**Immediately After (5 min):**
- [ ] Save code to GitHub (private repo)
- [ ] Document any promises made
- [ ] Note technical decisions that need revisiting
- [ ] Share staging URL with facilitator

**Debrief with Facilitator (10 min):**
- What worked technically?
- What took longer than expected?
- What would you do differently?
- What did you learn about their problem?

**If They Want to Continue:**
- [ ] Create proper project repository
- [ ] Set up development environment
- [ ] Write technical spec based on demo
- [ ] Estimate production timeline
- [ ] Propose architecture improvements

---

## Tips from Experience

### Time Savers
✅ Use TypeScript templates (catch errors faster)
✅ Prettier/ESLint configured (don't think about formatting)
✅ Component libraries (shadcn, MUI, Chakra)
✅ Copilot/Cursor (generate boilerplate fast)
✅ Snippet library for common patterns

### Time Wasters
❌ Perfectionism (good enough > perfect)
❌ Over-engineering (build for now, not future)
❌ Rabbit holes (timebox investigation to 3 min)
❌ Complex state management (keep it simple)
❌ Custom styling (use defaults)

### Psychological Tricks
🧠 **The "Explainer Code" Method:**
Write code that's obvious to read during demo.
Verbose variable names, clear comments.

🧠 **The "Happy Path First" Rule:**
Get ONE scenario working perfectly.
Edge cases are "future enhancements."

🧠 **The "Live Test" Moment:**
Let THEM upload the file or click the button.
Creates ownership and excitement.

---

## Pre-Session Warmup Routine

**15 Minutes Before Session:**

```bash
# 1. Clear your workspace
cd ~/50min-mvp
mkdir session-$(date +%Y%m%d-%H%M)
cd session-$(date +%Y%m%d-%H%M)

# 2. Test your deploy pipeline
vercel whoami  # Verify logged in
git config --global user.name  # Verify git setup

# 3. Open your toolbox
code .
open -a "Slack"
open -a "Browser" https://dashboard.vercel.com

# 4. Mental prep
# Review previous session notes
# Clear your head
# Get water
```

---

## Success Metrics

**Technical Success:**
- ✅ Deployed within 30 minutes
- ✅ Demo doesn't crash
- ✅ Addresses core problem stated in intake
- ✅ Code quality allows for production evolution

**Client Success:**
- ✅ Client says "wow, that was fast"
- ✅ Client understands how it works
- ✅ Client sees path to production
- ✅ Client wants to continue (conversion)

**Learning Success:**
- ✅ Identified a new template opportunity
- ✅ Added reusable component to library
- ✅ Improved your speed on [X] type of problem
- ✅ Better time estimation for next session

---

## Emergency Contacts & Resources

**During Session:**
- Facilitator Slack: `#50min-mvp-live`
- Stack Overflow: [Keep tab open]
- API Docs: [Bookmark common ones]

**Code Libraries:**
```
/snippets
├── auth-patterns/
├── data-validation/
├── error-handling/
├── file-upload/
└── api-integration/
```

**Quick References:**
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Supabase Quick Start](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

**Remember:** The goal is proof-of-concept, not perfection. Show them it's possible, show them it's valuable, show them YOU can build it. Everything else is iteration.

**You've got this. 🚀**
