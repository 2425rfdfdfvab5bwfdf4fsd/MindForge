# PRD Generator Prompt
> Copy this prompt into any AI (Claude, ChatGPT, Gemini), fill in the USER INPUT section, and get a complete agent-ready PRD.

---

## How to Use

1. Copy everything below the horizontal rule
2. Replace everything between `--- USER INPUT ---` and `--- END INPUT ---` with your project details
3. Paste into your AI of choice
4. Hand the generated PRD directly to an AI coding agent

---

## The Prompt

```
You are a senior product manager and software architect.
Your job is to generate a complete, professional Product Requirements Document (PRD)
that is crystal-clear for an AI coding agent to implement without ambiguity.

--- USER INPUT ---
Project Name: [YOUR PROJECT NAME]
One-line Description: [WHAT THE APP DOES IN ONE SENTENCE]
Target Users: [WHO WILL USE IT]
Core Problem: [WHAT PROBLEM IT SOLVES]
Tech Stack Preference: [e.g. React + Node, Python Flask, etc. or "suggest one"]
Must-Have Features: [LIST YOUR KEY FEATURES]
Nice-to-Have Features: [OPTIONAL FEATURES]
Design Style: [e.g. minimal, dark mode, dashboard-style, mobile-first]
--- END INPUT ---

Generate the PRD using EXACTLY this structure:

---

# PRD: [Project Name]
**Version:** 1.0
**Date:** [Today's Date]
**Status:** Ready for Development

---

## 1. EXECUTIVE SUMMARY
Write 2–3 sentences: what the product is, who it's for, and what core problem it solves.

---

## 2. PROBLEM STATEMENT
### 2.1 Current Pain Points
- Bullet list of 3–5 specific problems users face today

### 2.2 Proposed Solution
One paragraph describing how this product solves those problems.

---

## 3. GOALS & SUCCESS METRICS
### 3.1 Primary Goals
- [ ] Goal 1 (measurable)
- [ ] Goal 2 (measurable)
- [ ] Goal 3 (measurable)

### 3.2 Success Metrics (KPIs)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| [metric] | [value] | [method] |

---

## 4. TARGET USERS
### 4.1 Primary User Persona
- **Name:** [Persona name]
- **Role:** [Who they are]
- **Goals:** [What they want to achieve]
- **Frustrations:** [What currently blocks them]
- **Tech Level:** [Beginner / Intermediate / Advanced]

### 4.2 Secondary User (if any)
[Brief description or "None"]

---

## 5. TECH STACK & ARCHITECTURE
### 5.1 Recommended Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | [tech] | [why] |
| Backend | [tech] | [why] |
| Database | [tech] | [why] |
| Auth | [tech] | [why] |
| Hosting | [tech] | [why] |

### 5.2 Project Structure
Provide the folder/file structure the coding agent should create:
\```
project-root/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── api/ or server/
├── public/
└── ...
\```

### 5.3 Key Environment Variables Needed
\```
VARIABLE_NAME=description_of_what_it_is
\```

---

## 6. FEATURES & REQUIREMENTS
For EVERY feature, use this exact format:

### Feature [N]: [Feature Name]
- **Priority:** P0 (must-have) / P1 (important) / P2 (nice-to-have)
- **User Story:** As a [user], I want to [action] so that [benefit]
- **Acceptance Criteria:**
  - [ ] Criterion 1 (specific, testable)
  - [ ] Criterion 2 (specific, testable)
  - [ ] Criterion 3 (specific, testable)
- **UI Notes:** Describe exactly what the user sees and interacts with
- **API/Logic Notes:** Describe data flow, validations, edge cases
- **Dependencies:** List any features or services this depends on

[Repeat for every feature — P0 first, then P1, then P2]

---

## 7. DATA MODELS
For each entity, define the schema clearly:

### [Entity Name]
\```typescript
interface EntityName {
  id: string;           // auto-generated UUID
  field1: string;       // description
  field2: number;       // description
  field3: boolean;      // description
  createdAt: Date;      // timestamp
}
\```

---

## 8. API ENDPOINTS
List every API route the backend needs:

| Method | Endpoint | Auth Required | Request Body | Response | Description |
|--------|----------|---------------|--------------|----------|-------------|
| GET | /api/items | No | — | Item[] | Fetch all items |
| POST | /api/items | Yes | {name, type} | Item | Create item |
| PUT | /api/items/:id | Yes | {name} | Item | Update item |
| DELETE | /api/items/:id | Yes | — | {success} | Delete item |

---

## 9. PAGES & ROUTES
List every page/screen in the app:

| Route | Page Name | Auth Required | Description |
|-------|-----------|---------------|-------------|
| / | Home | No | Landing page |
| /dashboard | Dashboard | Yes | Main app view |
| /settings | Settings | Yes | User settings |

---

## 10. UI/UX REQUIREMENTS
### 10.1 Design Principles
- [Principle 1: e.g., "Mobile-first responsive design"]
- [Principle 2: e.g., "Dark mode support"]
- [Principle 3: e.g., "Accessible — WCAG AA compliant"]

### 10.2 Color & Theme
- Primary Color: [hex or description]
- Background: [hex or description]
- Typography: [font family]
- Component Library: [e.g., shadcn/ui, Material UI, custom]

### 10.3 Key UI Flows
Describe the 2–3 most critical user journeys step by step:

**Flow 1: [Name]**
1. User lands on [page]
2. User clicks [button/link]
3. System shows [UI element]
4. User inputs [data]
5. System responds with [result]

---

## 11. AUTHENTICATION & AUTHORIZATION
- **Auth Method:** [e.g., Email/Password, Google OAuth, JWT]
- **Roles:**
  | Role | Permissions |
  |------|-------------|
  | Admin | Full access |
  | User | [specific access] |
  | Guest | [specific access] |

---

## 12. ERROR HANDLING & EDGE CASES
List critical edge cases the coding agent must handle:
- [ ] What happens when a user submits an empty form?
- [ ] What happens when the API is unavailable?
- [ ] What happens when a user tries to access a resource they don't own?
- [ ] What happens when a file upload exceeds the size limit?
- [Add more specific to the app]

---

## 13. PERFORMANCE & SECURITY REQUIREMENTS
- [ ] Page load under 2 seconds on 4G
- [ ] All user inputs sanitized before database writes
- [ ] Passwords hashed (never stored plain)
- [ ] API rate limiting on public endpoints
- [ ] No sensitive data exposed in client-side code
- [ ] HTTPS enforced in production

---

## 14. OUT OF SCOPE (v1.0)
Explicitly list what is NOT being built to prevent scope creep:
- [Feature A] — deferred to v2
- [Feature B] — not in initial release
- [Integration C] — future consideration

---

## 15. IMPLEMENTATION ORDER
Provide the exact order the coding agent should build this:

**Phase 1: Foundation**
1. Project setup & folder structure
2. Database schema & models
3. Auth system

**Phase 2: Core Features**
4. [Feature name] (P0)
5. [Feature name] (P0)
6. [Feature name] (P0)

**Phase 3: Secondary Features**
7. [Feature name] (P1)
8. [Feature name] (P1)

**Phase 4: Polish**
9. Error handling & loading states
10. Mobile responsiveness
11. Performance optimization

---

## 16. OPEN QUESTIONS
List any decisions still needed before/during development:
- [ ] Should [X] support [Y]?
- [ ] What is the limit for [Z]?

---

**END OF PRD**

---

RULES FOR GENERATING THIS PRD:
1. Be SPECIFIC — no vague language like "user-friendly" or "fast". Give exact specs.
2. Every feature must have acceptance criteria that are testable.
3. Every API endpoint must have its request/response types defined.
4. Every data model must have all fields typed.
5. The implementation order must be logical — no feature should depend on something built later.
6. Flag any assumption you make with a note: ⚠️ ASSUMPTION: [what you assumed]
7. If the user's input is missing critical info, state: ❓ NEEDS CLARIFICATION: [what's missing]
```
