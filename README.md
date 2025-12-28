# Nursery Management Platform (Sovereign & Multi-Tenant)

A modern, sovereign, multi-tenant SaaS platform designed for UK-based Nurseries. Built to be compliant with EYFS frameworks and GDPR, offering a cost-effective alternative to major incumbents like Famly and Connect Childcare.

## 🚀 Project Status: Active Development

### ✅ Completed Modules

#### 1. Core Infrastructure & Authentication
- **Tech Stack**: Next.js 14+ (App Router), TypeScript, PostgreSQL, Prisma ORM, Shadcn/UI, TanStack Query.
- **Multi-Tenancy**: Tenant isolation via `tenantId` in all database models.
- **Authentication**: JWT-based auth with secure HttpOnly cookies. Role-Based Access Control (RBAC) engine (e.g., Manager, Staff).
- **Core Config**: Room management (capacity, age ranges) and key person assignment.

#### 2. Child Management (CRM)
- **Profiles**: Comprehensive child profiles including demographics, funded hours tracking, and care preferences.
- **Health & Safety**: Medical information, dietary requirements (allergies, intolerances), and emergency contact management with "Authorized to Collect" flags.
- **Search & Filter**: Advanced filtering by room, status, and allergies.

#### 3. Digital Attendance Register
- **Tablet-First Design**: Optimized for touch interfaces in busy rooms.
- **Real-Time Tracking**: Exact timestamps for check-in and check-out to ensure ratio compliance.
- **Bulk Actions**: One-tap bulk check-in for groups of children.
- **Absenteeism Management**: Mark absent with reasons (Notified/Unnotified).
- **Correction Tools**: "Undo" functionality for check-ins, check-outs, and absences to quickly fix mistakes.
- **Stats Dashboard**: Live view of Present, Expected, Departed, and Absent children.

#### 4. Daily Care Logging
- **Activity Timeline**: Chronological feed of a child’s day.
- **Batch Logging**: Record activities (e.g., meals) for multiple children simultaneously.
- **Essential Logs**:
  - 🍼 **Meals**: Menu items, portion consumed (All/Most/Some/None).
  - 💤 **Sleep**: Sleep start/end times and 10-minute safety checks.
  - 🚽 **Nappy/Toileting**: Wet/Soiled/Dry status and cream application.
  - 📝 **Notes**: General updates for parents.

---

### 🚧 Pending / Roadmap (In Accordance with Design Doc)

#### Phase 3: Parent Partnership & Communication (High Priority)
- [ ] **Parent Portal**: Mobile-responsive web app for parents to view timeline and invoices.
- [ ] **Billing & Invoicing**:
  - UK "Stretched" Funding Calculator (15/30 hours).
  - Automated monthly invoicing and Tax-Free Childcare reconciliation.
  - "Split-Bill" logic for separated parents.
- [ ] **Direct Messaging**: WhatsApp-style internal messaging between staff and parents.
- [ ] **Newsletters**: Rich-text editor for weekly/monthly updates.

#### Phase 4: Learning & Development (EYFS)
- [ ] **Observations**: Media-rich observation logging (photos/videos).
- [ ] **EYFS Tagging**: "Flagging" system for Prime and Specific areas of learning (avoiding tick-boxes).
- [ ] **2-Year Progress Check**: Wizard to generate statutory progress reports.
- [ ] **Montessori / Curiosity Approach**: Toggles for different pedagogical frameworks.

#### Phase 5: Safeguarding & Compliance (Critical)
- [ ] **Digital Accident Book**:
  - **Body Maps**: Visual selector for injury location.
  - **Signatures**: Digital collection of staff and parent signatures.
  - **Retention Policy**: "Long-Term Archive" for records (statutory 21 years + 3 months).
- [ ] **Safeguarding Vault**: Restricted access logs for DSLs (Designated Safeguarding Leads).
- [ ] **Staff Ratios**: Real-time ratio breach alerts on dashboards.

#### Phase 6: Staff & Operations
- [ ] **Rostering**: Shift planning and "Bank Staff" management.
- [ ] **DBS & Qualifications**: Tracking expiry dates for staff certifications.
- [ ] **Occupancy Modelling**: Predictive analytics for future capacity planning.

---

## 🛠️ Operational & Compliance Requirements
*   **Data Sovereignty**: Self-hostable on Linux/PostgreSQL to avoid vendor lock-in and high cloud costs.
*   **GDPR**: "One-Click SAR Export" to handle Subject Access Requests efficiently.
*   **Ofsted Readiness**: All logs are designed to be audit-ready and tamper-evident.

## 🏁 Getting Started

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose

### Development Setup
1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Database Setup**:
    ```bash
    # Start Postgres
    docker-compose up -d
    
    # Run migrations and seed data
    npx prisma migrate dev
    npm run seed
    ```
3.  **Run Development Server**:
    ```bash
    # Start Backend (NestJS)
    cd apps/api && npm run start:dev
    
    # Start Frontend (Next.js) - in a new terminal
    cd apps/web && npm run dev
    ```
4.  **Access**:
    *   Web App: `http://localhost:3000`
    *   API: `http://localhost:3001`
