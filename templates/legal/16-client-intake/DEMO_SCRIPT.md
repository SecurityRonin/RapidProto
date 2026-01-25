# Template #16: Client Intake & Onboarding - Demo Script

**Target Audience:** Law firms, accounting firms, consulting firms, any professional services

**Pain Points:**
- Manual intake forms that require re-entry
- Conflict checks done manually or forgotten
- Client onboarding scattered across emails and spreadsheets
- No way to track intake status
- Missing documents, incomplete information

## 50-Minute Session Breakdown

### Minutes 0-10: Problem Discovery

**Builder Setup (Silent):**
```bash
cd template-16-client-intake
npm install
cp .env.example .env.local
# Add CLERK_SECRET_KEY and DATABASE_URL
npm run db:push
```

**Facilitator Questions:**
1. "Walk me through what happens when a new client contacts you today."
2. "How do you check for conflicts of interest?"
3. "What documents do you typically need from new clients?"
4. "How long does it take from first contact to engagement letter?"
5. "Where do client details get lost in the process?"

**Expected Answers:**
- "They email us, we send a PDF form, they fill it, scan it back"
- "We manually search our client list and accounting system"
- "ID, business license, tax returns - but getting them is like pulling teeth"
- "2-3 weeks with all the back-and-forth"
- "Between email, our CRM, and whoever's desk it's sitting on"

### Minutes 10-40: Build Phase

**Builder Actions:**

1. **Customize intake form** (5 min)
   ```typescript
   // Edit components/intake-form.tsx
   // Add firm-specific fields (practice area, matter type, etc.)
   ```

2. **Configure AI document extraction** (5 min)
   ```typescript
   // lib/ai/document-extraction.ts already set up
   // Demo: Upload business license → auto-extract name, address, license #
   ```

3. **Set up conflict check rules** (5 min)
   ```typescript
   // lib/actions/clients.ts - runConflictCheck()
   // Configure: check against existing clients, matters, opposing parties
   ```

4. **Customize email templates** (5 min)
   ```typescript
   // lib/email.ts
   // Add firm branding, engagement letter attachment
   ```

5. **Deploy to Vercel** (10 min)
   ```bash
   vercel --prod
   # Add custom domain: intake.yourfirm.com
   ```

**Facilitator Activities with Client:**

- **Activity 1: Map Current Workflow** (10 min)
  - Draw on whiteboard: Current vs. Future state
  - Identify bottlenecks and handoffs

- **Activity 2: Design Ideal Intake Form** (10 min)
  - What questions do you REALLY need upfront?
  - What can wait until after engagement?
  - Prioritize: Must-have vs. Nice-to-have

- **Activity 3: ROI Calculator** (10 min)
  - Current time per intake: ____ hours
  - Current cost per intake: $____
  - Number of intakes per month: ____
  - Time savings with automation: ____
  - Monthly ROI: $____

### Minutes 40-50: Demo & Close

**Live Demo Flow:**

1. **Public Intake Form** (2 min)
   - Client fills form from phone
   - Uploads business license photo
   - AI extracts: business name, license #, address
   - Auto-populates client fields

2. **Admin Dashboard** (3 min)
   - New submission appears instantly
   - Click "Check Conflicts" → Shows clear/conflict
   - Click "Approve" → Options:
     - ✅ Create client record
     - ✅ Generate onboarding tasks
     - ✅ Send welcome email
   - One click → Client onboarded

3. **AI Magic Moment** (2 min)
   - Upload scanned driver's license
   - Show extracted fields: name, DOB, address, ID#
   - "Imagine this with contracts, tax returns, financial statements"

4. **Onboarding Tasks** (2 min)
   - Auto-generated checklist:
     - Send engagement letter (due in 2 days)
     - Schedule initial consultation (due in 7 days)
     - Set up client portal access (due in 3 days)
   - Assignable to team members

5. **Close** (1 min)
   - "This is live right now at intake.demo.com"
   - "You can start using it TODAY"
   - "Let's talk about your custom fields and rules"

**Three-Path Close:**

**Path 1: "Let's Go Live Today"** ($2,500)
- Deploy with your branding
- 30-min onboarding call
- 5 custom fields
- Email templates
- Live in 24 hours

**Path 2: "Custom Workflow"** ($7,500)
- Everything in Path 1
- Custom conflict check rules
- Integration with your practice management software
- Custom onboarding task templates
- 2 weeks delivery

**Path 3: "Enterprise Package"** ($15,000)
- Everything in Path 2
- Multi-office support
- Advanced analytics dashboard
- Automated matter opening
- Dedicated support for 90 days

## Key Demo Talking Points

### For Law Firms:
- "This eliminates the intake paralegal bottleneck"
- "Conflict checks happen automatically, no more ethics violations"
- "From contact to engagement letter in 24 hours instead of 2 weeks"

### For Accounting Firms:
- "Tax season onboarding without the chaos"
- "Client documents auto-extracted, no more data entry"
- "Track which clients are stuck waiting for info"

### For Consulting Firms:
- "Professional first impression with branded intake"
- "Qualification happens before you waste time on calls"
- "Conflict checks for competitive clients"

## Technical Highlights (For Savvy Clients)

- **AI-Powered:** Vercel AI Gateway (GPT-4o) extracts data from documents
- **Secure:** Clerk authentication, encrypted storage
- **Fast:** Edge database (Turso), instant loading
- **Compliant:** Audit trail for every submission, GDPR-ready
- **No Lock-in:** Export all data anytime

## Common Objections & Responses

**"We already have a CRM"**
→ "This integrates with your CRM via API. Think of it as the front door, your CRM is the house."

**"Our clients are older, they won't use tech"**
→ "That's why we made it simpler than Gmail. One form, drag-and-drop files, done."

**"What about security? We handle sensitive info"**
→ "Bank-level encryption, SOC 2 compliant hosting, you control access. More secure than email attachments."

**"We need this to do X specific thing"**
→ "That's exactly why we're showing you now - so we can customize it for X before you go live."

## Follow-Up Materials

After demo, send:
1. **This live link:** intake.demo.yourfirm.com
2. **Video recording** of their specific demo
3. **ROI calculation** with their numbers
4. **Custom scope** based on their requirements

## Success Metrics

Track and report back:
- **Time savings:** Hours per intake before/after
- **Conversion rate:** Submissions → Engaged clients
- **Data quality:** Incomplete fields before/after
- **Conflict catch rate:** Conflicts detected automatically

---

**Pro Tips:**
- Pre-populate demo with THEIR firm name/logo
- Use THEIR real client scenarios in conflict check demo
- Have engagement letter template ready with their branding
- Reference specific pain points they mentioned in discovery
