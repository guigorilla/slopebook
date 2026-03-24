# Slopebook — Product Overview

## What It Is

Slopebook is a cloud-based SaaS platform purpose-built for ski resorts, independent ski schools, and freelance instructors. It replaces fragmented spreadsheets, phone-based bookings, and manual payments with a unified system that manages the full lifecycle of a ski lesson — from discovery and booking through payment, instruction, and post-lesson review.

## Target Market

The platform targets three tiers of customer:

- **Independent instructors** — need a simple booking page and earnings visibility
- **Mid-size ski schools** — require scheduling, staff management, and reporting
- **Large resort operators** — demand integrations, analytics, and white-label branding

A tiered subscription model ensures each segment pays proportionally to the value received.

## Key Differentiators

- North American market focus with bilingual support (English and French) from day one
- Multi-currency processing (USD and CAD) with currency set at the resort level
- Payment infrastructure layer that abstracts across Stripe and Shift4
- Household account model — one adult manages reservations for multiple family members including children
- Card-on-file charging via stored payment tokens
- Dual-mode waitlist (by time slot or by specific instructor)

## User Personas

| Role | Description |
|------|-------------|
| **Guest (Student)** | Age 20–55. Books lessons 1–5x per season. Primarily mobile. May book for themselves or as part of a household. |
| **Head of Household** | Adult managing reservations for multiple family members including minors. Stores card on file for repeat bookings. Needs unified view of all upcoming lessons. |
| **Instructor** | Certified ski instructor, may work one resort or freelance across multiple. Needs real-time schedule, check-in tools, and earnings summary. Primarily mobile. |
| **School Admin** | Operations manager at a ski school. Manages 5–80 instructors. Needs scheduling, conflict resolution, bulk communications, and revenue reporting. Primarily desktop. |
| **Resort Operator** | GM or Director of Ski Operations. Oversees one or more ski schools. Needs aggregated dashboards, white-label portal, and resort-wide policy controls. |

## Goals

- Reduce booking friction by 80% compared to phone/email-based processes
- Give instructors real-time visibility into their schedules and earnings
- Give students and household managers a consumer-grade mobile booking experience with instant confirmation
- Give resort operators actionable data on utilization, revenue, and instructor performance
- Support Canadian and US resorts natively with bilingual UI and multi-currency billing

## Non-Goals (v1.0)

- Equipment rental management
- Lift ticket sales or integration with ski resort POS systems
- Native iOS / Android apps (responsive PWA only in v1.0)
- Additional languages beyond English and French
- Additional currencies beyond USD and CAD
- AI-based instructor matching or dynamic pricing

## Release Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Alpha** | Q2 2026 | Core booking engine, Stripe + Shift4 payment abstraction, instructor availability, admin scheduler. Bilingual EN/FR booking widget. USD + CAD. Internal testing with 2 pilot ski schools. |
| **Beta** | Q3 2026 | Group lessons, lesson packages, household accounts with learner sub-profiles, card-on-file tokens, dual-mode waitlist. Earnings dashboard. 10 paying customers. |
| **v1.0 GA** | Q4 2026 | White-label widget, resort operator portal, revenue analytics, Google Calendar sync. Full public launch. |
| **v1.5** | Q1 2027 | Gift cards, multi-school management, QuickBooks integration, additional processor support, SOC 2 certification, PIPEDA compliance audit. |
| **v2.0** | Q3 2027 | Native iOS & Android apps, AI instructor matching, dynamic pricing, additional language support, lift ticket API integration. |

## Pricing Tiers

| Tier | Price | Target | Key Limits |
|------|-------|--------|------------|
| Starter | $49 / mo | Independent instructors | 1 instructor, 100 bookings/mo |
| Growth | $249 / mo | Small ski schools | Up to 15 instructors, unlimited bookings |
| Pro | $799 / mo | Mid-size ski schools | Up to 60 instructors, multi-school, analytics |
| Enterprise | Custom | Resorts & large operators | Unlimited instructors, white-label, SLA, SSO |

A flat 1.5% platform fee applies to all transactions.

## Success Metrics

### Product KPIs
- Booking completion rate: > 70% of sessions reaching the date picker convert to a confirmed booking
- Booking widget load time: < 2s on 4G (p95)
- Instructor schedule accuracy: < 0.5% double-booking rate
- Support ticket volume: < 2% of bookings generate a support request

### Business KPIs
- MoM MRR growth: ≥ 15% in the first 12 months post-launch
- Net Revenue Retention (NRR): ≥ 110% by end of Year 1
- CAC payback period: < 8 months
- Gross margin: ≥ 70% at steady state

### Customer Satisfaction
- Student NPS: ≥ 45
- Admin / operator NPS: ≥ 50
- Monthly active instructor retention: ≥ 85% during active season
