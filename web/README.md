# RapidProto

**Build working prototypes in 50 minutes. Together.**

A synchronized timer app for builder-facilitator teams. The builder codes while the facilitator handles client conversations—same sprint, parallel workflows.

---

## Quick Start

### As a Builder
1. Go to [rapidproto.vercel.app](https://rapidproto.vercel.app)
2. Click **Start Building**
3. Name your session and select **Builder**
4. Share the session code with your facilitator
5. Start the timer and build

### As a Facilitator
1. Get the session code from your builder
2. Go to [rapidproto.vercel.app](https://rapidproto.vercel.app)
3. Click **Join Session**
4. Enter the code and select **Facilitator**
5. Follow your guided workflow while the builder codes

---

## The 50-Minute Sprint

| Phase | Builder | Facilitator |
|-------|---------|-------------|
| **0-10 min** | Discovery: Define feature, pick template | _Waiting for build phase_ |
| **10-40 min** | Build: Code the prototype | Expectations → Long Term → Close |
| **40-50 min** | Demo/Verify: Test and ship | _Demo time together_ |

Both roles see the same timer. Both stay focused on their workflow.

---

## Features

### Guided Checklists
Each phase has step-by-step tasks. Expand any step to:
- Add your answer or client response
- Take notes
- Mark complete

**Autosave**: Your inputs save automatically as you type. Look for "Saving..." → "Saved ✓"

### Timer Warnings
Visual alerts keep you on track:
- **5 minutes left**: Yellow highlight
- **1 minute left**: Red + "1 MIN LEFT" badge
- **10 seconds**: Pulsing red urgency

### Keyboard Shortcuts
Work faster without reaching for buttons:

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume |
| `→` | Advance to next phase |
| `←` | Go back (facilitator only) |
| `Esc` | Clear focus |

Shortcuts appear on buttons when enabled. They don't fire when you're typing in an input.

### Session History
Completed sessions appear on the landing page. Click to expand and:
- View key decisions (core feature, template, changes)
- Export as Markdown or JSON
- Delete from history

---

## Builder Workflow

### Discovery (10 min)
1. **Define the core feature** — What's the ONE thing this prototype must do?
2. **Pick a template** — Choose a starting point that gets you closest
3. **List required changes** — What needs to be added or modified?

### Build (30 min)
1. **Set up the project** — Clone template, install dependencies
2. **Implement core feature** — Build the main functionality
3. **Style and polish** — Make it look presentable

### Demo/Verify (10 min)
1. **Test the happy path** — Does the core feature work?
2. **Fix critical bugs** — Only blockers, skip nice-to-haves
3. **Ship or screenshot** — Deploy it or capture evidence

---

## Facilitator Workflow

While the builder codes (during Build phase), you handle client conversations:

### Expectations Stage
- Define prototype scope
- Clarify what's out of scope
- Set success criteria
- Explain technical limitations

### Long Term Stage
- Discuss feature roadmap
- Establish priority order
- Timeline expectations
- Ongoing relationship

### Close Stage
- Pricing discussion
- Package options
- Next steps
- Commitment/deposit

Your inputs sync to the builder's view, so they know what the client expects.

---

## Tips

**For Builders:**
- Pick a template you've used before—familiarity beats features
- Commit to "good enough"—polish kills prototypes
- If you're blocked, mark it and move on

**For Facilitators:**
- Front-load expectations—set scope early
- Capture exact phrases—the client's words matter
- Don't promise what the builder hasn't confirmed

**For Both:**
- Trust the timer—it's there to protect you
- Use notes liberally—you'll forget details later
- Export your session—create a record for follow-up

---

## Export Formats

### Markdown
Human-readable summary with:
- Session metadata (date, duration, status)
- Key decisions (core feature, template, changes)
- All steps with completion status and acquired values
- Notes captured during the session

### JSON
Machine-readable data for:
- Importing into other tools
- Building reports
- Archiving sessions programmatically

---

## Troubleshooting

**Timer not syncing?**
Both participants need to be on the same session. Check that you're using the correct session code.

**Keyboard shortcuts not working?**
Make sure you're not focused on an input field. Press `Esc` to clear focus first.

**Lost your work?**
Inputs autosave to localStorage. If the browser crashes, your data should still be there when you return.

**Session disappeared?**
Completed sessions move to history on the landing page. Check there first.

---

## Development

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000)

---

**Build prototypes. Close deals. In 50 minutes.**
