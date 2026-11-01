# Q3 Report Outline — Lutron SkillBridge (HRM-203 CA-2)

A concise structure for the Q3 write-up. Figures marked *demo* come from the synthetic seed data
and must be described as illustrative, not as Lutron Electronics records.

## 1. Problem statement

- CA-1 found three HR challenges at the Gurugram office: retention of specialised talent, hiring for
  niche technical roles, and **continuous skill development** (chosen focus).
- Technical roles (lighting design, applications, system sales engineering, IT security) need
  ongoing learning on products, control systems and tools; skill levels and training progress
  are hard to see in one place.
- Workforce context (CA-1 field-study estimate): ≈100–105 employees, near-term need +15–25,
  planning gap ≈18–23. Developing people internally reduces dependence on scarce external hires.

## 2. Objectives

1. Define a role-based competency framework (Core, Functional, Behavioural; levels 1–4).
2. Measure skill gaps per employee and highlight priority gaps (≥ 2 levels).
3. Link gaps to training programmes and track assignments to completion.
4. Give HR, managers and employees role-appropriate views and analytics.
5. Make career paths and individual development plans visible to support retention.

## 3. Proposed solution

Lutron SkillBridge, a web-based Training & Skill Development System prototype that connects
competencies → skill gaps → training → progress → analytics → career development.

## 4. Users and roles

| User | Main tasks |
| --- | --- |
| HR / L&D administrator | Maintain employees, competencies and programmes; assign training; monitor analytics |
| Manager | Assess direct reports, assign training, review team gaps, create development plans |
| Employee | View own gaps and plan, update training progress and goal status |

## 5. Modules

Dashboard · Employee management and profiles · Competency matrix · Skill gap analysis ·
Training catalogue · Training assignments · Learning analytics · Career development ·
Demo role access.

## 6. Technology stack

MongoDB + Mongoose, Express 5 / Node.js, React 19 + Vite, Tailwind CSS, Recharts, GSAP
(MERN stack). REST API with role-scoped responses; deterministic seed for repeatable demos.

## 7. Workflow

1. HR defines competencies and the expected level for each job role.
2. Manager (or HR) records the employee's current level in an assessment.
3. The system calculates gap = required − current (never negative) and flags priority gaps.
4. Matching programmes are suggested; HR/manager assigns them with a due date.
5. The employee updates progress; status changes automatically (Not Started → In Progress →
   Completed, or Overdue after the due date).
6. Dashboards and analytics update from the database; managers follow up on overdue work.
7. Development plans link goals, mentors and training to the next role on the career track.

## 8. Screenshot captions (suggested figures)

- **Figure 1.** Demo access — choosing the HR/Admin, Manager or Employee role (fictional personas).
- **Figure 2.** HR dashboard — KPIs, training status mix and skill gaps by department (*demo data*).
- **Figure 3.** Employee profile — Lighting Design Specialist competencies, required vs current level.
- **Figure 4.** Competency matrix — expected levels for the Lighting Design Specialist role.
- **Figure 5.** Skill gap analysis — gap severity with suggested training (*demo*: 86 gaps, 15 priority).
- **Figure 6.** Training catalogue — programmes linked to competencies and target roles.
- **Figure 7.** Training assignments — automatic status from progress and due date.
- **Figure 8.** Progress update — status preview before saving.
- **Figure 9.** Learning analytics — completion by department and frequent skill gaps
  (*demo*: completion 39.2 %, participation 91.3 %).
- **Figure 10.** Career development — Lighting Design track and an individual development plan.
- **Figure 11.** Manager view — the same dashboard scoped to direct reports.

## 9. Benefits

- One view of skills, gaps and training for HR, managers and employees.
- Objective, consistent gap calculation and prioritisation of training spend.
- Faster readiness of new and junior technical staff; fewer overdue programmes through alerts.
- Visible career paths and development plans that support retention of specialists.
- Data for workforce planning (where to train internally vs. hire).

## 10. Limitations

- Academic prototype with synthetic data; frameworks and tracks are proposals, not company policy.
- Demo role switch instead of real authentication; no approvals, notifications or audit trail.
- Self-reported progress; assessment levels depend on manager judgement.
- Single office and language; no integration with HRIS, LMS or payroll.

## 11. Future scope

- Secure login with role-based access and audit logs.
- Training requests, approvals and budget tracking.
- E-mail / Teams reminders; feedback surveys and training-effectiveness (Kirkpatrick) measures.
- Certification tracking, succession planning and retention-risk indicators.
- Report exports and integration with HRIS/LMS platforms.
