# Scholarship Selection Tracker System

A production-grade platform for an NGO Education Partnership to recruit, assess, interview, visit, evaluate, and select scholarship students across all 25 provinces of Cambodia — supporting 50,000+ students and multi-year selection cycles.

This repository currently contains the **design and specification set** for the system (no application code yet). It is organized so an engineering team can scaffold and build directly from these documents.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React, TypeScript, TailwindCSS, ShadCN UI, React Hook Form, TanStack Table, Recharts |
| Backend | Supabase (PostgreSQL, Storage, Edge Functions) |
| Auth | Firebase Authentication (Google + Email/Password) bridged into Supabase RLS |
| Map | React Leaflet + Cambodia province GeoJSON |
| AI | Claude API (Anthropic) |
| Hosting | Vercel |

## Document Index

| # | Document | Contents |
|---|---|---|
| 1 | [docs/01-prd.md](docs/01-prd.md) | Product Requirements Document — business process, personas, all functional modules, non-functional requirements |
| 2 | [docs/02-architecture.md](docs/02-architecture.md) | System architecture diagram, component responsibilities, auth bridge, key data flows |
| 3 | [docs/03-erd.md](docs/03-erd.md) | Database ERD (Mermaid) and entity relationship notes |
| 4 | [docs/04-schema.sql](docs/04-schema.sql) | Full PostgreSQL/Supabase DDL — tables, constraints, indexes, triggers, RLS, audit log, soft delete |
| 5 | [docs/seed-data.sql](docs/seed-data.sql) | Reference seed data — 25 Cambodia provinces, roles, selection cycle |
| 6 | [docs/05-api-design.md](docs/05-api-design.md) | REST API endpoint design (Next.js route handlers + Supabase) |
| 7 | [docs/06-nextjs-structure.md](docs/06-nextjs-structure.md) | Full Next.js 15 project folder structure |
| 8 | [docs/07-ui-pages.md](docs/07-ui-pages.md) | UI/UX page specifications, dashboard design, GIS map interaction spec |
| 9 | [docs/08-ai-integration.md](docs/08-ai-integration.md) | Claude AI feature design — student summaries, home visit reports, recommendation engine, NL-to-SQL data assistant |
| 10 | [docs/09-security.md](docs/09-security.md) | Authentication flow, RBAC matrix, audit logging, encryption, file access security |
| 11 | [docs/10-deployment.md](docs/10-deployment.md) | Production deployment architecture and runbook |
| 12 | [docs/11-roadmap.md](docs/11-roadmap.md) | 4-week development roadmap |
| 13 | [docs/12-future-enhancements.md](docs/12-future-enhancements.md) | Future scalability and enhancement recommendations |

## Reading Order

For engineers starting implementation: **01 → 02 → 03/04 → 06 → 05 → 07 → 09 → 08 → 10**, then use **11** as the sprint plan.
