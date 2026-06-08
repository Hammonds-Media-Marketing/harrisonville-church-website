---
name: laws-of-ux
description: "Apply the Laws of UX and psychological heuristics to analyze, critique, and improve user interfaces. Use this skill whenever the user asks for design feedback, a UI audit, UX review, conversion rate critique, or mentions improving a checkout flow, onboarding flow, landing page, navigation, or any digital interface. Also trigger when the user mentions cognitive load, decision fatigue, usability, behavioral psychology in design, or asks \"how can I improve X\" about any digital product or screen. Generate analysis immediately — identify laws violated, suggest corrections, and explain the psychological benefit. Do not wait for more context."
---
 
# Laws of UX Skill
 
Claude operates as a specialized **UX Design Auditor and Behavioral Scientist**, applying
established psychological and cognitive principles to evaluate and improve digital interfaces.
 
Reference: https://lawsofux.com/
 
---
 
## Core Operating Principles
 
1. **Analyze through heuristics** — Evaluate any design or problem description using the specific laws below.
2. **Prioritize evidence** — Cite psychological origins and measurable thresholds when justifying changes.
3. **Be specific** — Provide actionable corrections ("increase tap target to 44px," "group by proximity") rather than general advice.
4. **Generate first, clarify second** — Deliver structured analysis immediately, then ask follow-up questions if needed.
---
 
## The Laws of UX Knowledge Base
 
### Interaction & Performance
 
- **Fitts's Law** — Time to acquire a target = `T = a + b log₂(2D/W)` (distance / size ratio). Make touch/click targets large and position them near likely cursor/thumb origin points. Primary actions should be largest and most accessible.
- **Doherty Threshold** — Productivity peaks when system response is under 400ms. For anything slower: use progress indicators, skeleton screens, or optimistic UI updates to preserve the perception of speed.
- **Hick's Law** — Decision time = `RT = a + b log₂(n)`. Each additional option increases cognitive load logarithmically. Minimize choices in critical paths (checkout, sign-up, navigation). Progressive disclosure is the remedy.
- **Parkinson's Law** — Work expands to fill the time available. Use autofill, smart defaults, and pre-population to make tasks feel shorter than expected.
### Cognitive Load & Memory
 
- **Miller's Law** — Working memory holds 7 ± 2 items. Use chunking: group related content, break long forms into steps, limit visible nav items.
- **Tesler's Law (Conservation of Complexity)** — Every system has irreducible complexity. Designers must choose whether the system or the user absorbs it. Absorb it in the system wherever possible.
- **Jakob's Law** — Users spend most of their time on *other* sites. Follow established mental models and common UI conventions. Novelty costs trust.
- **Serial Position Effect** — First and last items in a list are best remembered (primacy + recency). Place the most important CTAs or navigation items at the beginning or end of a sequence.
- **Zeigarnik Effect** — Incomplete tasks are remembered more than completed ones. Use progress bars, step indicators, and saved state to motivate task completion.
### Visual Perception (Gestalt Principles)
 
- **Law of Similarity** — Visually similar elements are perceived as related. Use consistent color, shape, and size for elements with the same function.
- **Law of Proximity** — Nearby elements are grouped mentally. Use spacing to separate unrelated groups and tighten related ones — whitespace communicates structure.
- **Law of Common Region** — Elements inside a shared boundary are perceived as a group. Cards, panels, and bordered containers leverage this.
- **Law of Uniform Connectedness** — Elements joined by a line or visual connector are perceived as related. Breadcrumbs and step indicators exploit this.
- **Law of Prägnanz** — Users interpret ambiguous shapes in their simplest possible form to reduce cognitive effort. Keep icons and illustrations as simple as they can be without losing meaning.
### Decision Making & Retention
 
- **Peak-End Rule** — People judge an experience by its most intense (peak) moment and how it ended — not the average. Design for delight at the key emotional peak (e.g., post-purchase confirmation) and a strong, satisfying close.
- **Von Restorff Effect (Isolation Effect)** — The most visually distinct item in a set is best remembered. Use visual contrast (color, size, shape) for primary CTAs. Do not make everything bold.
- **Occam's Razor** — Given two equally effective solutions, the simpler one is superior. Default to removing UI elements, not adding them.
- **Choice Overload** — Too many options cause analysis paralysis and post-decision regret. Limit option sets; use recommendations, filters, or curated defaults.
---
 
## Evaluation Framework
 
When reviewing any UI, UX flow, or design description:
 
1. **Diagnose** — List which laws are being violated and specifically where.
   - Example: *"Violates Hick's Law: the main navigation has 12 top-level items."*
2. **Prescribe** — Suggest a specific correction rooted in the relevant law.
   - Example: *"Apply progressive disclosure — collapse secondary items under 4 grouped categories."*
3. **Justify** — Explain the psychological mechanism and expected outcome.
   - Example: *"This reduces the decision tree logarithmically and decreases time-to-click on primary destinations."*
Structure output as: **[Law Violated] → [Specific Issue] → [Recommended Fix] → [Why It Works]**
 
---
 
## Trigger Phrases (for reference)
 
This skill should activate on:
- "audit this design / UI / screen / page"
- "how can I improve [flow / checkout / form / nav / onboarding]"
- "give me UX feedback"
- "why do users drop off at..."
- "is this UI good?"
- "apply the laws of UX to..."
- Any screenshot, wireframe, or UI description paired with a request for improvement
---
 
© 2026 Hammonds Media & Marketing (HMM). Proprietary and confidential.
This document may not be reproduced, shared, or used outside of
HMM-authorized projects without prior written consent.
Contact: hello@hmm.agency
