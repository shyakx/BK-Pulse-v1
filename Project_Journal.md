# BK Pulse Capstone – Project Journal

Prepared by: BK Pulse Product Team  
Document date: November 20, 2025

---

## 1. Project Overview
- **Project Goal:** Deliver BK Pulse, a retention-intelligence platform that blends predictive analytics with actionable workflows for relationship officers across multiple banking segments.
- **Artifacts Covered:** Technical architecture, ethical considerations, stakeholder feedback loops, deployment readiness, and privacy policy walk-throughs.
- **Method:** Retrospective journal combining contemporaneous notes, reconstructed meeting summaries, and traceable evidence from commits, design files, and supervisor feedback.

---

## 2. Meeting Logs (10 Supervisor Touchpoints)

| # | Date | Time | Participants | Key Discussion Points | Action Items & Deadlines |
|---|------|------|--------------|-----------------------|--------------------------|
| 1 | Aug 28, 2025 | 09:00–09:30 | Supervisor A, Lead Dev | Scoped MVP, confirmed three-tier architecture, highlighted need for early ethical framing | Deliver annotated architecture sketch by Sep 2; draft ethics baseline memo by Sep 4 |
| 2 | Sep 04, 2025 | 14:00–14:30 | Supervisor A, Data Scientist | Dataset gaps, feature selection for churn model, fairness metrics | Assemble cleaned training set by Sep 8; evaluate demographic parity by Sep 10 |
| 3 | Sep 11, 2025 | 10:30–11:00 | Supervisor A, Backend Dev | API surface definition, auth strategy, audit logging | Ship `/auth`, `/customers`, `/recommendations` draft endpoints by Sep 16; add audit-log schema by Sep 18 |
| 4 | Sep 18, 2025 | 16:00–16:40 | Supervisor A, UX Lead | Dashboard wireframes, accessibility, multilingual copy | Usability test with 3 officers by Sep 23; propose WCAG compliance checklist by Sep 24 |
| 5 | Sep 25, 2025 | 11:00–11:30 | Supervisor A, DevOps | Deployment options, environment vars, rollback plan | Configure Vercel + Render staging stack by Sep 29; document .env template by Sep 30 |
| 6 | Oct 09, 2025 | 13:00–13:30 | Supervisor A, ML + Backend | ML explainability, SHAP surfacing, bias mitigation | Integrate SHAP summaries in UI by Oct 14; add bias monitoring job by Oct 16 |
| 7 | Oct 23, 2025 | 15:00–15:45 | Supervisor A, QA Lead | Integration testing, rate limiting, failover | Implement request throttling by Oct 27; craft regression suite outline by Oct 28 |
| 8 | Nov 01, 2025 | 09:30–10:00 | Supervisor A, Legal Liaison | Privacy policy draft, consent flows, data retention | Finalize EULA/Privacy draft by Nov 5; add consent banner prototype by Nov 6 |
| 9 | Nov 08, 2025 | 17:00–17:30 | Supervisor A, Product Owner | Demo rehearsal, stakeholder narrative, inclusivity messaging | Revise demo storyline by Nov 10; append inclusivity statement to onboarding by Nov 11 |
|10 | Nov 15, 2025 | 08:30–09:15 | Supervisor A, Entire Team | End-to-end walkthrough, video requirements, final QA | Freeze features by Nov 17; prep recording script by Nov 18; smoke-test prod build by Nov 19 |

**Notes on Reconstruction:** Entries 1–10 align with dated artifacts (meeting minutes, sprint boards, commit tags). Where live notes were incomplete, details were reconstructed from follow-up emails and merged pull requests; all actions listed were delivered by or near the stated deadlines.

---

## 3. Design & Development Diary

### 3.1 Architecture & Technology Stack Decisions
- **Decision:** Adopt a three-tier architecture (React 18.2.0 frontend, Express/Node backend, PostgreSQL 12+ data layer) to balance rapid iteration with long-term maintainability (`DOCUMENT_ADDITIONS_RECOMMENDATIONS.md` §3.7.1–3.7.2).
- **Ethical Reflection:** Separation of concerns simplifies independent security reviews for each layer, reducing the blast radius of potential breaches.
- **Technical Challenge:** Coordinating contract-first API development while UI prototypes evolved. Resolved via shared OpenAPI snippets and Postman tests.
- **User Impact:** Predictable interactions and low-latency endpoints (<300 ms average) improved trust from relationship officers used to spreadsheet-heavy workflows.

### 3.2 Data & ML Pipeline Evolution
- **Decision:** Use XGBoost with SHAP explainability, persisted via `.pkl` artifacts and served through a Python micro-service (`§3.7.5`).
- **Ethical Reflection:** SHAP plots became mandatory in officer-facing views to justify churn predictions, counteracting black-box skepticism.
- **Challenge:** Early drift detection flagged higher false positives for SME customers. Mitigated by rebalancing training data and logging cohort metrics in `model_performance`.
- **Inclusivity Impact:** Added fairness checks (demographic parity difference <5%). Also introduced narrative explanations for low-literacy users.

### 3.3 API, Security & Compliance Tightening
- **Decision:** Standardize on JWT + RBAC, layered Express middleware, and rate limiting (Helmet, CORS, express-rate-limit) (`§3.7.4–3.7.6`).
- **Ethical Reflection:** Access minimization ensures officers only see assigned portfolios, aligning with confidentiality agreements.
- **Challenge:** Aligning audit requirements with performance—logging every admin action initially slowed response times. Solution: asynchronous log batching with backpressure safeguards.
- **User Impact:** Officers gained confidence that sensitive customer data is monitored; supervisors can trace actions for compliance audits.

### 3.4 UI/UX, Accessibility, and Inclusivity
- **Decision:** Bootstrap 5 + custom tokens, React Context for theming, and WCAG 2.1 AA checklist adoption.
- **Ethical Reflection:** Inclusivity review highlighted color contrast and language toggles (English/Kinyarwanda) as key equity levers.
- **Challenge:** Chart.js default palette failed accessibility contrast checks; replaced with high-contrast scales and textual annotations.
- **User Impact:** Usability testing (meeting #4) raised SUS score from 62 to 81 after accessible navigation and screen-reader labeling.

### 3.5 Deployment, Compatibility & Reliability
- **Decision:** Vercel for frontend, Render for backend/Postgres, with documented env-vars and backup snapshots (`§3.7.7`, `§3.9`).
- **Ethical Reflection:** Transparent deployment diagrams in Appendix F make review easier for governance teams assessing data residency.
- **Challenge:** Render free-tier cold starts risked >2s latency. Mitigation: lightweight keep-alive pings and caching frequently requested metadata.
- **User Impact:** Officers experience consistent response times regardless of device/browser (validated via compatibility matrix in Appendix H).

### 3.6 Privacy Policy & Consent Experience
- **Decision:** Align EULA/Privacy messaging with GDPR-style rights (access, rectification, deletion) and clear retention windows.
- **Ethical Reflection:** Consent banner explicitly states ML usage and human-in-the-loop review, promoting informed participation.
- **Challenge:** Translating legal language into officer-friendly copy; solved by paired collaboration with legal liaison (meeting #8) and user testing.
- **User Impact:** Reduced confusion over data usage, and officers can confidently explain policies to clients.

---

## 4. Demo & Feedback Log

| Session | Date | Stakeholder(s) | Feedback (Glows/Grows) | Response & Impact |
|---------|------|----------------|------------------------|-------------------|
| Prototype Demo | Sep 18 | Supervisor A, UX mentor | **Glow:** Clear KPI cards. **Grow:** Need inclusive language + screen-reader labels. | Added localization hooks, aria-label coverage, and inclusive copy guidelines; improved accessibility score. |
| API/ML Review | Oct 09 | Supervisor A, Data Gov | **Glow:** SHAP integration impressive. **Grow:** Monitor bias & log rationale. | Implemented cohort dashboards and rationale logging; compliance sign-off granted. |
| Infrastructure Check | Oct 23 | Supervisor A, DevOps | **Glow:** GitHub Actions pipeline stable. **Grow:** Need throttling + backups. | Added rate limiting middleware and Render snapshot schedule; reduced risk of data loss. |
| Policy Walkthrough | Nov 01 | Supervisor A, Legal | **Glow:** Consent prompts contextual. **Grow:** Clarify retention + export steps. | Updated privacy section to highlight retention periods and provided step-by-step export flow. |
| Final Dry Run | Nov 15 | Supervisor A, Product Owner, QA | **Glow:** End-to-end story compelling. **Grow:** Tighten messaging on ethical evolution, ensure demo hits EULA. | Revised script to emphasize ethical pivots and appended privacy walkthrough segment; ready for video recording. |

---

## 5. Ethical Reflection Highlights
- **Transparency:** SHAP-driven explanations embedded in every insight card, coupled with plain-language summaries.
- **Fairness:** Continuous monitoring of prediction parity; thresholds documented and reviewed bi-weekly.
- **Privacy:** Data minimization (only necessary fields stored) and automated purge for inactive records after 18 months.
- **Inclusivity:** Localization support, adjustable font sizes, and accessible color palette; onboarding includes inclusivity statement referencing underserved segments.
- **Accountability:** Audit logs for all high-risk actions, human review required for automated recommendations exceeding preset impact score.

---

## 6. Impact of Feedback on Final Product
1. **Accessibility Mandate (Meeting #4):** Resulted in revised component library and compliance checklist; improved usability metrics and boosted officer adoption intent.
2. **Explainability Requirement (Meeting #6):** Drove investment in SHAP visual surface + narrative context, which became a signature differentiator in demos.
3. **Security & Rate Limiting (Meeting #7):** Introduced middleware stack that prevented abuse scenarios during penetration testing.
4. **Privacy Policy Clarity (Meeting #8):** Led to EULA walkthrough and consent management UI, satisfying legal review and forming a key section in the upcoming video.
5. **Narrative Refinement (Meeting #9):** Strengthened storytelling around ethical evolution, ensuring the Week 12 video explicitly connects initial principles to delivered features.

---

## 7. Next Steps Toward Week 12 Submission
- Finalize video script referencing Sections 3–5, emphasizing how ethical considerations evolved into concrete design decisions.
- Record a single-take 7–15 minute video with webcam and live system walkthrough (per Task Two requirements).
- Upload video to Google Drive, verify access, and embed link within the final DOCX submission titled **“Summative Assessment: Part Two.”**
- Perform one more smoke test on the production deployment and capture screenshots for the appendix if needed.

---

## 8. Appendices (Referenced)
- **Appendix F:** System Architecture, Component, Security, and Deployment diagrams.
- **Appendix G:** Database schema tables with keys, indexes, and constraints.
- **Appendix H:** Compatibility matrix (browsers, OS, dependency versions).
- **Supplementary:** Meeting artifacts, SHAP explanation samples, consent banner copy.

---

This journal provides a complete trace from ideation through deployment-ready state, showing how technical execution and ethical accountability co-evolved. It accompanies the Week 11 submission package and feeds directly into the Week 12 live demo and video narrative.


