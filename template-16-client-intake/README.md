# Template #16: Client Intake & Onboarding

**Professional services client intake automation with AI document extraction and conflict checking.**

Perfect for: Law firms, accounting firms, consulting firms, financial advisors, or any professional services requiring client onboarding.

## Features

### 🎯 Core Features
- **Public Intake Form** - Mobile-friendly form for client information
- **Document Upload** - Drag-and-drop with Vercel Blob storage
- **AI Data Extraction** - Auto-extract data from IDs, licenses, tax returns, contracts
- **Conflict Checking** - Automated conflict of interest detection
- **Admin Dashboard** - Review, approve/reject submissions
- **Auto-Onboarding** - Generate tasks, send welcome emails automatically
- **Client Portal** - Secure client login (via Clerk)

### 🤖 AI-Powered
- **Document Extraction** using GPT-4o via Vercel AI Gateway
  - Business licenses → Business name, license #, address, expiry
  - Driver's licenses → Name, DOB, address, ID number
  - Tax returns → Name, Tax ID, filing status, income
  - Contracts → Parties, dates, terms
  - Financial statements → Assets, liabilities, net worth
- **No BYOK Required** - Uses Vercel AI Gateway (bills to your account)
- **Confidence Scores** - Know when AI is uncertain
- **Validation Warnings** - Catches OCR errors, invalid formats

### ⚖️ Professional Services Features
- **Conflict Detection** - Search existing clients for opposing parties
- **Manual Override** - Partner can approve with notes
- **Audit Trail** - Who checked what and when
- **Onboarding Tasks** - Auto-generate checklist per client type
- **Email Automation** - Welcome emails, engagement letters
- **Status Tracking** - Prospect → Active → Inactive → Conflict

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Add:
```env
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Turso (Database)
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token

# Vercel Blob (File uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Resend (Email)
RESEND_API_KEY=re_...

# Vercel AI Gateway (AI features - no BYOK needed!)
# Uses your Vercel account billing
```

### 3. Set Up Clerk

1. Create account at [clerk.com](https://clerk.com)
2. Create application
3. Enable Email/Password
4. Copy API keys to `.env.local`

### 4. Set Up Turso

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso  # macOS
# OR
curl -sSfL https://get.tur.so/install.sh | bash  # Linux

# Create database
turso db create aiapp4biz-intake

# Get URL and token
turso db show aiapp4biz-intake --url
turso db tokens create aiapp4biz-intake
```

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Run Development Server

```bash
npm run dev
```

Visit:
- Public intake: `http://localhost:3000/intake`
- Admin dashboard: `http://localhost:3000/admin` (requires auth)

### 7. Deploy to Vercel

```bash
vercel --prod
```

Add environment variables in Vercel dashboard.

## Testing

```bash
# Run all tests
npm test

# Run specific tests
npm test schema
npm test clients
npm test document-extraction
npm test intake-form

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Project Structure

```
template-16-client-intake/
├── app/
│   ├── intake/page.tsx          # Public intake form
│   └── admin/page.tsx            # Admin dashboard
├── components/
│   ├── intake-form.tsx           # Client-facing form
│   ├── admin-dashboard.tsx       # Admin UI
│   └── __tests__/                # Component tests
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Database schema
│   │   └── __tests__/            # Schema tests
│   ├── actions/
│   │   ├── clients.ts            # Client CRUD actions
│   │   ├── intake.ts             # Intake submission
│   │   ├── admin.ts              # Admin actions
│   │   └── __tests__/            # Action tests
│   ├── ai/
│   │   ├── document-extraction.ts # AI extraction logic
│   │   └── __tests__/            # AI tests
│   └── email.ts                  # Email utilities
└── DEMO_SCRIPT.md                # Sales demo guide
```

## Database Schema

### Tables

**clients** - Client records
- id, name, type (individual/business), email, phone
- status (prospect/active/inactive/conflict)
- address (JSON), source, assignedTo
- timestamps

**intakeForms** - Form templates
- id, name, fields (JSON), status
- timestamps

**intakeSubmissions** - Form submissions
- id, formId, clientId (nullable)
- submitterEmail, submitterName, data (JSON)
- status (pending/approved/rejected)
- reviewedBy, reviewNotes, reviewedAt
- timestamps

**conflictChecks** - Conflict of interest checks
- id, clientId, opposingParties (JSON)
- status (clear/conflict/review)
- checkedBy, notes, clearedAt
- timestamps

**onboardingTasks** - Client onboarding checklist
- id, clientId, title, description
- status (pending/in_progress/completed)
- priority (low/medium/high), assignedTo
- dueDate, completedAt
- timestamps

**clientDocuments** - Uploaded documents
- id, clientId, documentType, fileName, fileUrl
- uploadedBy, extractedData (JSON)
- timestamps

## API Routes

### Public Routes (No Auth)

**POST /api/intake** - Submit intake form
```json
{
  "formId": "form_123",
  "submitterName": "John Doe",
  "submitterEmail": "john@example.com",
  "data": {
    "fullName": "John Doe",
    "phone": "555-0100",
    "company": "ACME Corp",
    "message": "Need help with contract review",
    "documents": ["https://blob.vercel-storage.com/doc.pdf"]
  }
}
```

**POST /api/upload** - Upload document (Vercel Blob)

### Admin Routes (Auth Required)

**GET /api/admin/submissions** - Get pending submissions

**POST /api/admin/approve** - Approve submission
```json
{
  "submissionId": "sub_123",
  "createClient": true,
  "generateTasks": true,
  "sendWelcomeEmail": true
}
```

**POST /api/admin/conflict-check** - Run conflict check
```json
{
  "clientId": "client_123",
  "opposingParties": ["Company A", "John Smith"],
  "override": false,
  "notes": "..."
}
```

## Customization Guide

### Add Custom Fields to Intake Form

Edit `components/intake-form.tsx`:

```typescript
const intakeSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  // Add your fields:
  practiceArea: z.enum(['corporate', 'litigation', 'tax']),
  matterType: z.string(),
  estimatedValue: z.number().optional(),
})
```

### Customize Document Types

Edit `lib/ai/document-extraction.ts`:

```typescript
const typeSpecificInstructions = {
  // Add your document type:
  engagement_letter: `Extract: parties, effectiveDate, scope, fees, terms`,
  medical_records: `Extract: patientName, dateOfService, diagnosis, provider`,
}
```

### Add Custom Onboarding Tasks

Edit `lib/actions/clients.ts`:

```typescript
const defaultTasks = [
  {
    title: 'Your custom task',
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
  },
  // ... more tasks
]
```

### Customize Email Templates

Edit `lib/email.ts`:

```typescript
const templates = {
  welcome: {
    subject: 'Welcome to [Your Firm]',
    body: `...your custom template...`,
  },
  engagementLetter: {
    subject: 'Engagement Letter - [Matter]',
    body: `...your custom template...`,
  },
}
```

## Integration Examples

### Integrate with Clio (Practice Management)

```typescript
// lib/integrations/clio.ts
import { createClient } from '@/lib/actions/clients'

export async function syncToClio(clientData: any) {
  const clioClient = await fetch('https://app.clio.com/api/v4/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        name: clientData.name,
        email: clientData.email,
        // ... map fields
      },
    }),
  })

  return clioClient.json()
}
```

### Integrate with QuickBooks

```typescript
// lib/integrations/quickbooks.ts
export async function createQBCustomer(clientData: any) {
  // Use QuickBooks SDK
  // Create customer record
  // Return QB customer ID
}
```

## Common Workflows

### Workflow 1: New Client Intake

1. Client fills intake form at `yourfirm.com/intake`
2. Uploads driver's license + business license
3. AI extracts: Name, DOB, Business name, License #
4. Submission appears in admin dashboard
5. Admin clicks "Check Conflicts"
6. System searches for: Business name in existing clients
7. If clear: Admin clicks "Approve" with options:
   - ✅ Create client
   - ✅ Generate tasks
   - ✅ Send welcome email
8. Client receives welcome email
9. Admin sees 3 onboarding tasks in dashboard
10. Tasks assigned to team members

### Workflow 2: Conflict Detection

1. Admin enters opposing parties: "ACME Corp, John Smith"
2. System searches all clients for matches
3. Finds: ACME Corp (existing client since 2020)
4. Status: **CONFLICT**
5. Admin reviews and decides:
   - Override with justification notes
   - Or reject the new client
6. Audit trail logged

### Workflow 3: Bulk Document Processing

1. Client uploads 5 documents
2. AI processes each:
   - Tax return → Extract Tax ID, income
   - Business license → Extract license #, expiry
   - Contract → Extract parties, dates
   - Financial statement → Extract assets
   - ID card → Extract name, DOB
3. All data auto-populated in client record
4. Admin reviews confidence scores
5. Low-confidence fields flagged for manual review

## Troubleshooting

### AI Extraction Not Working

Check:
1. Vercel AI Gateway enabled in project settings
2. Document is clear/readable (not blurry photo)
3. Document type matches expected format
4. Check confidence scores - may need manual review

### Conflict Check Always Returns "Clear"

Check:
1. Client names in database match format
2. Search is case-insensitive
3. Opposing parties entered correctly (comma-separated)

### Email Not Sending

Check:
1. Resend API key valid
2. "From" domain verified in Resend
3. Email not in spam folder

### File Upload Failing

Check:
1. Vercel Blob token set correctly
2. File size under 4.5MB limit
3. File type allowed (.pdf, .doc, .docx, .jpg, .png)

## Performance

- **Page Load:** < 500ms (edge-optimized with Turso)
- **AI Extraction:** 2-5 seconds per document
- **Conflict Check:** < 1 second (indexed search)
- **Form Submission:** < 300ms

## Security

- **Authentication:** Clerk (industry-standard)
- **Data Encryption:** At rest and in transit
- **Access Control:** Role-based (admin vs. client)
- **Audit Trail:** All submissions and conflict checks logged
- **File Storage:** Vercel Blob (SOC 2 compliant)
- **No API Keys Exposed:** Server-side only

## License

MIT - Free to use, modify, and sell

## Support

Issues: GitHub Issues
Docs: This README + DEMO_SCRIPT.md
