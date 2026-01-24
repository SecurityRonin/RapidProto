# RapidProto: Facilitator Rundown

**From discovery to demo in 50 minutes**

## Your Role: The Translator & Orchestrator

You are the bridge between business needs and technical execution. Your job is to:

1. **Extract** the real problem (not the solution they think they want)
2. **Engage** the client while builder works
3. **Translate** technical concepts to business value
4. **Orchestrate** the demo for maximum impact
5. **Convert** interest into next steps

**Key Mindset:** You're a consultant, not an order-taker. Push back, ask why, dig deeper.

---

## Pre-Session Setup

### Materials Ready

**Digital:**
- [ ] Shared note-taking doc (Google Doc/Notion)
- [ ] Slack/Discord channel with builder
- [ ] Video call link tested
- [ ] Screen share ready
- [ ] Timer/stopwatch visible

**Physical:**
- [ ] Whiteboard or digital whiteboard (Miro/Figma)
- [ ] Pen and paper for quick notes
- [ ] Water (you'll be talking a lot)
- [ ] Calendar open for scheduling next steps

### Pre-Session Research (5-10 min)

If you know the client/company in advance:
- [ ] Review their website/product
- [ ] Check their industry (common pain points)
- [ ] LinkedIn stalking (who are the stakeholders?)
- [ ] Previous session notes (if repeat client)

---

## Session Timeline: Facilitator's Perspective

### Minutes 0-10: PROBLEM INTAKE

**Objective:** Get to the REAL problem and success criteria.

#### Opening (1 min)

```
"Thanks for joining! Here's how this works:

1. We'll spend 10 minutes understanding your problem
2. Our builder will create a working demo in 30 minutes
3. We'll show you what we built in the last 10 minutes
4. You'll walk away with a live prototype to test

Sound good? Let's dive in."
```

#### The Problem Excavation (6 min)

**Layer 1: Surface Problem (1 min)**

"Tell me what you're trying to solve."

[Let them talk. Take notes.]

**Layer 2: Current State (2 min)**

Core questions:
- "Walk me through how you handle this TODAY."
- "How much time/money does this cost you?"
- "Who's affected by this problem?"
- "What have you tried already?"

🚩 **Red flags to listen for:**
- "We just need..." (they're prescribing solution, not problem)
- "Something like [competitor]..." (they want a copy, not a fit)
- "Just a simple..." (usually not simple)

**Layer 3: Success Criteria (2 min)**

Critical questions:
- "If we solve this perfectly, what does that look like?"
- "How will you KNOW it's working?"
- "What's the minimum version that would be useful?"

**Framework: The "Three Wins" Question:**
```
"If we nail this, what are the three things you'd be able to do
that you can't do today?"

1. ___________________
2. ___________________
3. ___________________
```

This becomes your demo script later.

**Layer 4: Constraints (1 min)**

Must-know details:
- "What systems does this need to connect to?"
- "Any compliance/security requirements?"
- "Who needs access to this?"
- "Any existing data we should use?"

#### Builder Sync (30 seconds)

**Slack your builder:**

```
Problem: [One sentence summary]
Success: [What "working" looks like]
Template suggestion: [Your guess]
Data format: [CSV/API/Database]
Special needs: [Auth/Integration/etc]

Greenlight to start? ✅
```

**Wait for builder confirmation before continuing.**

#### Edge Case Hunting (1-2 min)

Ask the weird questions:
- "What's the weirdest edge case you've seen?"
- "What happens when [unlikely scenario]?"
- "Have you ever had [catastrophic failure]?"

**Why:** These become great demo moments ("See, it handles duplicates!")

**Document Everything:**

Use shared doc template:
```markdown
# Session: [Client Name] - [Date]

## Problem Statement
[2-3 sentences]

## Current Process
[How they do it today]

## Success Criteria
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

## Technical Requirements
- Data: [format/source]
- Integration: [systems]
- Users: [who/how many]
- Constraints: [security/compliance]

## Edge Cases
- [Case 1]
- [Case 2]

## Builder Notes
[Builder's messages]
```

---

### Minutes 10-40: BUILD PHASE (Engagement Mode)

**Objective:** Keep client engaged, gather more context, set up for conversion.

#### Transition (30 seconds)

```
"Perfect. Our builder is starting now. While they build,
let's dig into some of the details that will matter for
the production version."

[Share screen with whiteboard/doc]
```

---

#### Minutes 10-20: DEEP DIVE & MAPPING

**Activity 1: User Journey Mapping (5 min)**

```
"Let's map out how someone would actually use this."

[Whiteboard/Miro:]

┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ User    │───▶│ Action  │───▶│ System  │───▶│ Result  │
│ arrives │    │ takes   │    │ does    │    │ shows   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘

"Walk me through each step..."
```

**Questions while mapping:**
- "What could go wrong here?"
- "How often does this happen?"
- "Who else needs to be notified?"
- "What's the decision point?"

**Why:** This creates a detailed spec for post-demo work AND keeps them engaged.

**Activity 2: Data Deep Dive (5 min)**

```
"Can you show me a sample of your actual data?"

[Have them screen share or upload sample file]
```

**What to look for:**
- Data quality issues (nulls, formats, inconsistencies)
- Volume (100 rows or 100M rows?)
- Frequency (real-time or batch?)
- Relationships (how does data connect?)

**Document:**
```markdown
## Data Profile
- Volume: [X records/day]
- Format: [CSV/JSON/API]
- Quality: [Clean/Messy/Needs-cleanup]
- Update frequency: [Real-time/Hourly/Daily]
- Sample provided: ✅ [Yes/No]
```

**Slack builder:**
```
"Client shared sample data.
[Attach or link]
Format looks [clean/messy].
[Any surprises or gotchas]"
```

**Activity 3: Integration Inventory (5 min)**

```
"What systems would this need to talk to in production?"
```

Create a quick diagram:
```
     ┌──────────────┐
     │  Your Tool   │
     └──────┬───────┘
            │
    ┌───────┼───────┐
    │       │       │
┌───▼──┐ ┌──▼──┐ ┌─▼───┐
│ CRM  │ │ ERP │ │Email│
└──────┘ └─────┘ └─────┘
```

**For each integration, ask:**
- "Do they have an API?"
- "Do you have access/credentials?"
- "How critical is this vs. nice-to-have?"

**Rank integrations:**
```
P0 (Must-have): [Integration]
P1 (Important): [Integration]
P2 (Nice-to-have): [Integration]
```

---

#### Minutes 20-30: ROADMAP & CONVERSION SETUP

**Check in with Builder (Quick peek)**

```
[Check Slack]

If builder says "on track":
  → Continue roadmap discussion

If builder says "need 5 more min":
  → Extend deep dive activities
  → Ask more edge case questions

If builder says "blocker":
  → Assess: Can client help? (API key, sample data)
  → Or extend timeline: "Let's talk about v1 vs v2"
```

**Activity 4: Future State Planning (5 min)**

```
"Let's imagine this demo works perfectly.
What's the roadmap to get this in your team's hands?"
```

**Three-Phase Framework:**

```markdown
## Roadmap Discussion

### Phase 1: Proof of Concept (Today)
- We'll show: [Core feature]
- You'll learn: [Is this the right approach]

### Phase 2: Pilot Version (X weeks)
- We'd add: [Critical features]
- You'd test with: [Specific users/team]
- Success looks like: [Metric]

### Phase 3: Production (X months)
- We'd add: [Scale/security/polish]
- You'd deploy to: [All users]
- Success looks like: [Business impact]
```

**Questions to ask:**
- "When would you want to start pilot testing?"
- "Who are the internal champions we'd work with?"
- "What's the approval process for moving forward?"
- "What's your budget range for Phase 2?"

💡 **Sales intelligence gathering happening here**

**Activity 5: Team & Process (5 min)**

```
"Help me understand your team structure."
```

**Map the stakeholders:**
```
┌─────────────────┐
│  Decision Maker │  [Name/Role]
└────────┬────────┘
         │
    ┌────┴────┐
    │  Users  │  [Team/Dept]
    └─────────┘
```

**Questions:**
- "Who needs to sign off on this?"
- "Who would be the day-to-day users?"
- "Who's responsible for implementation?"
- "Any IT/security review needed?"

**Document decision process:**
```markdown
## Stakeholders
- Economic Buyer: [Person who approves budget]
- Champion: [Person who wants this built]
- Users: [People who will use it]
- Blockers: [People who could say no]

## Decision Timeline
- Demo: Today
- Internal review: [When]
- Decision point: [When]
- Ideal start: [When]
```

---

#### Minutes 30-35: DEMO PREP & FINAL SYNC

**Builder Check-in (Comprehensive)**

```
[Slack builder:]

"5 minutes to demo. Status?"

Expected responses:
✅ "Ready to go"
⚠️ "Need 2 more min"
🚧 "Core works, but [limitation]"
```

**If ready:**
```
"Perfect. Demo script is:
1. [Happy path scenario]
2. [Edge case we discussed]
3. [Their specific requirement]

Any issues to warn me about?"
```

**Activity 6: Test Data Prep (3 min)**

Work with client to prepare test data:
```
"Let's prepare a scenario to test in the demo.

Can you give me:
- A sample invoice number
- Expected outcome
- An edge case we discussed earlier"
```

**Why:** Client-provided test data makes demo feel personalized.

**Activity 7: Set Demo Expectations (2 min)**

```
"Before we jump into the demo, I want to set expectations.

What you're about to see is a 30-minute proof-of-concept.
It will:
✅ Demonstrate the core logic works
✅ Show it handles your data format
✅ Prove the approach is sound

It won't:
❌ Have full security/authentication
❌ Handle every edge case
❌ Be production-ready

The goal is to answer: 'Is this worth building fully?'

Make sense?"
```

**Prime them for success:**
```
"What I'm excited to show you is [specific feature].
Pay attention to [the thing that solves their problem].
I think you'll like how we handled [their edge case]."
```

---

### Minutes 35-40: DEMO TIME

**Objective:** Showcase value, create "wow" moments, set up next steps.

#### Opening (30 seconds)

```
"Alright, [Builder Name] is going to walk us through what they built.

[Builder], remind us: what was the core problem you were solving?"

[Let builder recap - ensures client hears problem → solution narrative]
```

#### Demo Flow (6-7 min)

**Your role during demo:**

1. **Narrate the business value**

   When builder shows technical feature, translate:
   ```
   Builder: "Here's the reconciliation algorithm..."
   You: "Which means your team saves 2 hours a day on manual checking."
   ```

2. **Ask questions clients might be thinking**

   ```
   "What happens if the file is formatted differently?"
   "Can we filter by date range?"
   "How fast does this process 1000 records?"
   ```

3. **Highlight specific wins**

   ```
   "Notice how it flagged that duplicate we talked about earlier?
   That's exactly the edge case you mentioned."
   ```

4. **Manage technical depth**

   If client is non-technical:
   ```
   "The technical details aren't important.
   What matters is [business outcome]."
   ```

   If client is technical:
   ```
   "[Builder], can you show them the code for that validation?"
   ```

5. **Create interaction moments**

   ```
   "[Client name], want to try uploading your file?
   Click the upload button..."

   [They interact with the tool]
   ```

   **Why:** Interaction = ownership = excitement

#### Demo Script Template

**1. Context Setting (1 min)**
```
"We heard you needed [problem].
Here's what we built."

[Show the landing screen]
```

**2. Happy Path (2 min)**
```
"Let me show you the typical workflow."

Step 1: [User action]
Step 2: [System response]
Step 3: [Result]

"This addresses [success criterion #1]."
```

**3. Edge Case Demo (2 min)**
```
"Remember you asked about [edge case]?
Watch what happens when..."

[Demonstrate edge case handling]

"See how it [handled gracefully]?
This addresses [success criterion #2]."
```

**4. Client Interaction (2 min)**
```
"Now you try. Upload your sample data."

[Client uploads/inputs]
[System processes]
[Show result]

"What do you think?"
[Let them react]
```

**5. Code Peek (1 min) - Optional**
```
Builder: "Let me show you the core logic quickly..."

[Show 10 lines of key code]

"This is where the matching happens."
```

**6. Future State Preview (1 min)**
```
"What you're seeing is the core.
In production, we'd add:
- User authentication
- Email notifications
- Export to [their system]
- Scheduling/automation

But the key logic? That's working right now."
```

#### Reading the Room

**Positive signals:**
- Leaning forward
- Asking "Can it do X?"
- Interrupting with ideas
- Smiling/nodding
- Taking notes

**Neutral signals:**
- Quiet observation
- "Interesting..."
- Asking about edge cases
- Comparing to current solution

**Negative signals:**
- Checking phone
- "We already do this with [tool]"
- Focusing on what's missing
- Mentioning budget constraints early

**Adjust your approach accordingly.**

---

### Minutes 40-50: NEXT STEPS & CONVERSION

**Objective:** Capture commitment, define next steps, close or qualify.

#### Immediate Feedback (2 min)

```
"First reaction - what do you think?"

[Shut up and listen]
```

**Listen for:**
- 🎯 "This is exactly what we need" → HOT LEAD
- 🤔 "This is interesting, but..." → QUALIFIED LEAD
- 😐 "It's nice, but..." → LUKEWARM
- 🚫 "This isn't quite right" → DISQUALIFY OR PIVOT

#### The "But" Technique (3 min)

If they say "This is great, BUT...":

```
"Tell me more about that concern."

[Listen to the objection]

Common objections:

1. "It's missing [feature]"
   Response: "Absolutely. That's a Phase 2 feature.
             Would you move forward if we added that?"

2. "We need to integrate with [system]"
   Response: "Good news - we've integrated with [system] before.
             That's a [X hour] add-on. Would that unblock you?"

3. "We don't have budget right now"
   Response: "When's your next budget cycle?
             We can park this as approved and start in [month]."

4. "I need to get approval"
   Response: "Who else needs to see this?
             Can we schedule a follow-up demo for them?"

5. "This seems expensive"
   Response: "Let's break it down. You said this costs you
             [X hours/week]. At $[Y/hour], that's [Z/month].
             Our build cost is [X], ROI in [timeframe]."
```

#### Three-Path Close (5 min)

**Path 1: HOT → Immediate Next Steps**

```
"I'm hearing you want to move forward. Great!

Next steps:
1. We'll send over a formal proposal by [date]
2. You get internal approval by [date]
3. We kick off [date]

Does that timeline work?

[Get calendar out]

Let's schedule the kickoff meeting right now."
```

**Path 2: QUALIFIED → Pilot Proposal**

```
"Sounds like you see the value, but need to validate internally.

Here's what I propose:

**Pilot Program:**
- 2-week build sprint
- Working version with [core features]
- You test with [specific team]
- If it works, we continue to full build
- If not, you only paid for pilot

Investment: $[X] for pilot
Full build: $[Y] if you continue

Want me to send over a pilot proposal?"
```

**Path 3: LUKEWARM → Long-Term Nurture**

```
"Seems like the timing isn't quite right.

What would need to change for this to be a priority?

[Listen]

Can I follow up in [timeframe] to check in?

In the meantime, we'll send you:
- Recording of this demo
- Code repository (yours to keep)
- Written summary of approach

And if anything changes, you know where to find us."
```

#### Capture Commitments (2 min)

**Get specific:**

```
"Before we wrap, let me confirm next steps:

You will:
- [ ] [Action item, by date]
- [ ] [Action item, by date]

We will:
- [ ] [Action item, by date]
- [ ] [Action item, by date]

Next meeting: [Date/time]

Did I miss anything?"
```

**Document immediately in shared doc.**

#### The Ask (1 min)

**If they're interested but not committed:**

```
"One ask before we wrap:

If we solve [their core problem] and the pilot works,
is there any reason you wouldn't move forward with the full build?"

[Listen for hidden objections]

"Great. Then let's make sure the pilot addresses exactly that."
```

---

## Communication Protocols with Builder

### During Problem Intake (Minutes 0-10)

**Slack messages to builder:**

```
[At 5 min mark:]
"Problem: [Summary]
Template: [Guess]
Greenlight? ✅"

[At 8 min mark:]
"Edge cases:
- [Case 1]
- [Case 2]
Sample data: [Attached/Coming]"

[At 10 min mark:]
"✅ Discovery complete. Starting engagement phase.
Any questions before I go silent?"
```

### During Build Phase (Minutes 10-40)

**Check-in schedule:**

- Minute 15: "Status check?"
- Minute 25: "5 min to demo. Ready?"
- Minute 30: "Demo starting now."

**When builder needs help:**

```
Builder: "Need their API key for [service]"
You: "On it."

[To client:]
"Quick question - our builder needs access to [service].
Do you have API credentials handy?"
```

**When builder hits blocker:**

```
Builder: "Integration won't work. Need 10 more min."

You assess:
- Can I extend discovery? → "Take 10 min"
- Client getting restless? → "What CAN you demo?"
- Critical blocker? → "Show mockup, explain approach"
```

### During Demo (Minutes 35-40)

**Your role:**
- Business translator
- Hype person
- Question asker
- Time keeper

**Slack to builder during demo:**

```
[If client asks technical question:]
"They asked: [Question]"

[If running long:]
"Wrap in 2 min"

[If going well:]
"They're loving it. Take your time."
```

---

## Advanced Facilitation Techniques

### The "Silence" Technique

After asking a question, **shut up**.

Let awkward silence happen. They'll fill it with valuable information.

```
You: "What's the real reason this isn't a priority right now?"
[SILENCE for 5-10 seconds]
Client: "Well, actually... [the real objection]"
```

### The "Strawman" Technique

Propose an intentionally wrong solution to get to the right one.

```
You: "So it sounds like you need a daily batch process?"
Client: "No no, we need real-time!"
You: "Ah! That changes everything. Tell me more..."
```

### The "Future Perfect" Technique

```
You: "It's 6 months from now. This is wildly successful.
     What's different about your day-to-day work?"

[They paint the picture]

You: "Great. Let's build exactly that."
```

### The "Permission" Technique

Ask permission to push back.

```
You: "Can I challenge that assumption for a second?"
[They say yes]
You: "You said you need [feature X], but based on what
     you told me about [problem], I think you actually
     need [feature Y]. Here's why..."
```

### The "Consultant's Mirror"

Repeat their words back, slightly differently.

```
Client: "We need to streamline the approval process."
You: "So the bottleneck is approvals taking too long?"
Client: "Yes, and also people don't know what to approve."
You: "Ah, it's both speed AND clarity. Got it."
```

---

## Handling Difficult Situations

### "We just need something simple"

```
You: "I love simple. Help me understand what 'simple' means to you.
     Walk me through the absolute minimum that would be useful."

[They describe, it's never simple]

You: "That makes sense. What you're describing is simple to USE,
     but has complexity under the hood. Let me show you how
     we'd approach it..."
```

### "Can you make it look like [competitor]?"

```
You: "We could, but I want to understand what you like about
     [competitor]'s approach first. Is it the UI? The workflow?
     The features?"

[They explain]

You: "Got it. We can definitely borrow that pattern.
     But I'd also suggest [differentiation], because
     your use case is slightly different. Here's why..."
```

### "What's this going to cost?"

**Too early (during discovery):**
```
You: "Great question. I don't have enough information yet.
     Give me 40 minutes - after you see the demo, I'll give
     you a ballpark range based on what we'd actually build."
```

**After demo:**
```
You: "Based on what we built today, production would be:

     Pilot (2 weeks): $[X-Y]
     Full build (4-6 weeks): $[X-Y]
     Ongoing: $[monthly]

     The variables are [integrations/complexity/scale].
     Want me to put together a formal proposal?"
```

### "We need this by [unrealistic date]"

```
You: "Let's work backwards from that date.

     Full production version: [X weeks]
     Pilot version: [Y weeks]

     If the date is fixed, we need to scope down.

     What's the absolute minimum you need by [date]?
     We can phase in the rest after."
```

### Multiple stakeholders with different opinions

```
You: "I'm hearing different priorities.

     [Person A], you need [X]
     [Person B], you need [Y]

     For this 30-minute demo, we'll focus on [X] because
     it's the core workflow.

     But let's capture [Y] for the production roadmap.

     Everyone aligned on that?"
```

---

## Post-Session Workflow

### Immediate (Within 5 minutes)

**Send follow-up email:**

```
Subject: [Company] 50-Minute MVP Demo - Next Steps

Hi [Name],

Thanks for the session today! Quick recap:

**What we built:**
- [Core feature demonstrated]
- [Link to live demo]
- [Link to code repository]

**What you said you need:**
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

**Next steps:**
- [ ] [Your commitment, by date]
- [ ] [Their commitment, by date]
- [ ] Next meeting: [Date/time]

**Attachments:**
- Demo recording
- Session notes
- Preliminary proposal/estimate

Questions? Hit reply.

Best,
[Your name]
```

### Debrief with Builder (10 minutes)

**Structured debrief:**

```markdown
## Session Debrief: [Client]

### What Worked
- [Technical win]
- [Process win]
- [Client engagement win]

### What Didn't
- [Technical challenge]
- [Process gap]
- [Missed expectation]

### Learnings
- [New template need]
- [Better question to ask]
- [Time estimation improvement]

### Client Status
- Heat level: 🔥/😐/❄️
- Probability to close: [%]
- Next action: [What]
- Timeline: [When]
```

### Sales Pipeline Update (5 minutes)

Update CRM or tracking:

```
Stage: [Demo Complete / Proposal Sent / Negotiation / Closed]
Value: $[X]
Probability: [%]
Next step: [Action]
Expected close: [Date]
Notes: [Key info]
```

---

## Metrics & Success Tracking

### Session Metrics

**Quantitative:**
- Time to complete: [X minutes]
- Builder deploy time: [X minutes]
- Number of features demoed: [X]
- Client interaction time: [X minutes]

**Qualitative:**
- Problem clarity: 1-5
- Client engagement: 1-5
- Demo quality: 1-5
- Next step commitment: Yes/No

### Conversion Metrics

**Track per session:**
- Demo → Proposal: [%]
- Proposal → Pilot: [%]
- Pilot → Production: [%]
- Overall conversion: [%]

**Financial:**
- Average deal size: $[X]
- Time to close: [X days]
- CAC (cost to acquire): $[X]
- LTV (if recurring): $[X]

---

## Continuous Improvement

### After Every 5 Sessions

Review and update:

1. **Discovery questions**
   - What questions revealed key insights?
   - What questions wasted time?
   - What did we miss asking?

2. **Engagement activities**
   - What kept clients engaged?
   - What felt like filler?
   - New activities to test?

3. **Demo patterns**
   - What "wow" moments landed?
   - What fell flat?
   - Better demo structures?

4. **Conversion approaches**
   - What objections came up repeatedly?
   - What closes worked?
   - Pricing feedback?

### Template Improvements

```markdown
## Discovery Script v[X]
Changes from v[X-1]:
- Added: [New question about X]
- Removed: [Question that didn't help]
- Reordered: [Better flow]

Results:
- Better problem clarity: +[X]%
- Shorter intake time: -[X] min
```

---

## Resources & Templates

### Quick Reference Cards

**Discovery Cheat Sheet:**
```
Core Questions:
1. What problem? [Surface]
2. How today? [Current state]
3. What success? [Criteria]
4. What constraints? [Technical]
5. What if...? [Edge cases]
```

**Objection Handling:**
```
"It's missing [X]" → Phase 2 feature
"Too expensive" → ROI calculation
"Need approval" → Expand demo audience
"Wrong timing" → Pilot program
"Not sure" → Trial period
```

**Close Checklist:**
```
- [ ] Clear next steps documented
- [ ] Specific commitments from both sides
- [ ] Calendar invites sent
- [ ] Follow-up email within 5 min
- [ ] CRM updated
- [ ] Builder debriefed
```

---

## Emergency Scenarios

### "Builder is 10 minutes late"

```
Start without them. Begin discovery phase.

Text builder: "Starting discovery. Join when ready."

If still MIA at minute 15:
"Looks like [builder] is stuck.
Let's do this: I'll run a deep requirements session,
we'll send you the demo link later today.
Does that work?"
```

### "Client brings surprise stakeholders"

```
"Welcome everyone! Let me adjust the agenda.

Before we dive in, let's go around:
- Your name
- Your role
- What you're hoping to see today

[Adjust demo to address multiple perspectives]
```

### "Demo completely fails"

```
Builder: "Site is down / deployment failed"

You: "Technology, right? [Laugh it off]

Let me show you what we built on my local environment.
[Screen share builder's localhost]

OR

The demo gods aren't with us today, but let me walk you
through screenshots and code. You'll get the idea..."

[Turn it into a technical deep dive]
```

### "Client says 'This already exists'"

```
"Tell me about that tool. What do you like about it?"

[Listen]

"And why are you looking for alternatives?"

[They reveal the gap]

"Ah, so you need [specific thing].
That's exactly where we differentiate..."
```

---

## Final Tips

### Energy Management
- ✅ Stand up during sessions (more energy)
- ✅ Drink water between sections
- ✅ Smile (they can hear it over video)
- ✅ Take notes (shows attention)

### Psychological Tricks
- 🧠 Mirror their language (build rapport)
- 🧠 Use their company name often (personalization)
- 🧠 Ask "Why?" like a 5-year-old (get to root)
- 🧠 Assume the sale (act like it's happening)

### Common Mistakes
- ❌ Talking too much (listen more)
- ❌ Defending the demo (acknowledge limitations)
- ❌ Getting technical (stay business-value focused)
- ❌ Rushing the close (let them decide)

### Success Indicators
- ✅ Client asks about pricing unprompted
- ✅ Client brings up specific use cases
- ✅ Client asks to show their team
- ✅ Client takes notes during demo
- ✅ Client asks "When can we start?"

---

**Remember:** Your job is to understand, translate, and orchestrate. The builder makes it work. You make it matter.

**You've got this. 🎯**
