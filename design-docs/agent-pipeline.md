# Slopebook — Agent Development and Deployment Pipeline

**Status:** Proposed, 2026-10-31. Nothing here is implemented beyond what "Current State" lists.
**Scope:** Product definition through production operations.
**Product context:** [overview.md](overview.md). Decisions in [decisions.md](decisions.md) take precedence.

## 1. Purpose

A small team, potentially one person, should be able to take an idea from product decision to safely operated production code, with agents doing most of the work and humans holding the decisions that matter.

The pipeline must:

- Make every change traceable from product decision to production release
- Use deterministic checks wherever a check can be deterministic
- Keep agents away from production data, production credentials and payment credentials
- Scale autonomy by risk, and earn more autonomy with measured results
- Live in this repository, versioned and reviewed like code

## 2. Current State

| Exists today | Gap |
|---|---|
| `pipeline-generate` and `pipeline-review`, covering design docs only | Nothing covers planning, code, tests, infrastructure, release or operations |
| Design artifacts move from `drafts/` to `design-docs/` | No link from a design artifact to a code change |
| `uc-validator` gate; `promote.sh` enforces READY/HOLD | Run 9 promoted `api-design.md` while it was on HOLD, so its CR-001, CR-003 and OQ-066 blockers are in the promoted spec |
| Agent specs in YAML | No runner in the repo; `trigger: manual` means a person starts each run |
| Superseded specs in `agents/archive/` | None |
| Specs name a class from `agents/policy.yaml` | No runner reads the policy yet |
| Pull request CI: lint, types, tests, build, secret scan, dependency audit | Not yet a merge requirement until branch protection is on; no infrastructure code |
| Monorepo apps | `apps/api` has no code; the other apps are scaffolds |

## 3. Principles

1. **Files are the interface.** Agents hand off through versioned artifacts in the repo, never through conversation memory.
2. **Humans are the authority on source documents.** `overview.md`, `ux-flows.md`, `decisions.md` and `uc-registry.md` change only through human-approved PRs.
3. **The author never approves its own work.** Reviewing agents run separately, with no write access to what they review.
4. **Gates are enforced by CI and GitHub branch protection,** not by agent instructions. An agent's prompt is not a security control.
5. **Small slices.** One work item maps to one PR that can be reverted independently.
6. **Stop rather than guess.** Unclear requirements become open questions, not assumptions.
7. **Every run leaves a record:** inputs, model, tools used, outputs, cost and result.

## 4. Pipeline Overview

```text
 1 PRODUCT ──> 2 DESIGN ──> 3 PLAN ──> 4 BUILD ──> 5 VERIFY ──> 6 RELEASE ──> 7 OPERATE
    │  H          │  H         │ H        │          │  H/A        │  H/A        │
    └─────────────┴────────────┴──────────┴──────────┴─────────────┴─────────────┘
                                     8 LEARN
              production signals, pilot feedback and failures feed stage 1
```

`H` = human gate. `H/A` = human or automatic by risk tier (section 7).

| Stage | Purpose | Agents | Output | Exit gate |
|---|---|---|---|---|
| **1. Product** | Turn evidence into scope | `product-lead`, `research-analyst` | Proposed `overview.md`/`uc-registry.md`/`decisions.md` changes, use cases | Human merges source doc changes; `uc-validator` passes |
| **2. Design** | Specify how it works | `tech-lead`, `api-design-writer`, `data-modeler`, `ui-ux-lead`, `critic`, `open-questions-tracker`, `consistency-checker` | API, data, UX and technical specs | Synthesis READY; no RED issues; human approves promotion |
| **3. Plan** | Break specs into shippable slices | `planner` | Work items in `work/` with risk tier, acceptance criteria, dependencies | Human approves the batch |
| **4. Build** | Implement one slice | `implementer`, `test-writer`, `infra-engineer`, `migration-author` | PR with code, tests and docs | CI green; PR template complete |
| **5. Verify** | Independently challenge the PR | `code-reviewer`, `security-reviewer`, `spec-auditor`, `qa-agent`, `eval-runner` | Review comments, QA report, eval results | Required checks pass; approval per tier |
| **6. Release** | Ship safely | `release-manager` | Staging deployment, release notes, production promotion | Smoke tests pass; approval per tier |
| **7. Operate** | Keep it healthy | `ops-triage`, `cost-watcher`, `dependency-steward` | Triage reports, rollback proposals, maintenance PRs | Human owns incidents |
| **8. Learn** | Improve the product and pipeline | `retro-analyst` | Proposed decisions, new evals, agent spec changes | Human approves changes |

## 5. Agent Roster

Existing agents keep their current jobs; the design pipeline stays intact and gains an enforced gate.

Permissions: **R** read repo, **D** write drafts or `work/`, **B** write to a feature branch, **C** comment on PRs, **S** deploy to staging.

| Agent | Status | Permissions | Responsibility |
|---|---|---|---|
| `team-lead` | Existing, extended | R, D | Orchestrates stages; dispatches only |
| `product-lead` | Existing | R, D | Use cases from source documents |
| `research-analyst` | New | R, D, web | Pilot notes, market and vendor research, with sources |
| `uc-validator` | Existing | R, D | Registry coverage gate |
| `tech-lead` | Existing | R, D | Technical requirements |
| `api-design-writer` | Existing | R, D | API specification |
| `data-modeler` | Existing | R, D | Data model |
| `ui-ux-lead` | Existing | R, D | UX assets and screens |
| `critic` | Existing | R, D | Finds design faults |
| `open-questions-tracker` | Existing | R, D | Tracks open questions |
| `consistency-checker` | Existing | R, D | Cross-document consistency |
| `planner` | New | R, D | Creates work items; assigns risk tier |
| `implementer` | New | R, B | Code for one work item |
| `test-writer` | New | R, B | Writes tests from acceptance criteria, ideally before seeing the implementation |
| `migration-author` | New | R, B | Prisma migrations with rollback notes |
| `infra-engineer` | New | R, B | Infrastructure code and CI changes; always Tier 3 |
| `code-reviewer` | New | R, C | Correctness and maintainability |
| `security-reviewer` | New | R, C | Auth, tenant isolation, secrets, injection, privacy |
| `spec-auditor` | New | R, C | Confirms the PR does what the work item says, and nothing else |
| `qa-agent` | New | R, C, S | Drives preview and staging in a browser against acceptance criteria |
| `eval-runner` | New | R, C | Runs AI evals; reports regressions |
| `release-manager` | New | R, D, S | Prepares and tracks releases |
| `ops-triage` | New | R, D, read-only telemetry | Correlates alerts with recent changes |
| `cost-watcher` | New | R, D | Tracks LLM and cloud spending |
| `dependency-steward` | New | R, B | Dependency and security update PRs |
| `retro-analyst` | New | R, D | Finds patterns in run records and escapes |

No agent holds merge rights, production deployment rights, production database access or access to tenant payment credentials. Production deployment runs from a protected GitHub environment, using short-lived credentials issued only after its gates pass.

## 6. Key Artifacts and Traceability

A chain of IDs connects each stage:

```text
Decision (decisions.md) -> Registry item -> UC-xxx -> TR-xxx -> WI-xxx -> PR -> Release -> Observation
```

**Work item** (`work/WI-0123.md`):

```yaml
---
id: WI-0123
title: Import a school's daily schedule
status: ready          # draft | ready | in_progress | in_review | done | blocked
risk_tier: 2
phase: 1
use_cases: [UC-101]
requirements: [TR-140]
depends_on: [WI-0120]
touches: [packages/operations, apps/api]
---
## Acceptance criteria
- Given ..., when ..., then ...

## Tests required
## Out of scope
## Rollback
```

Rules:

- `implementer` works only on `status: ready` items.
- Work is limited to the paths in `touches`; `spec-auditor` flags anything else.
- PRs must reference a WI, and CI fails without one.
- An item that cannot be finished is set to `blocked` with a question, not left half-done.

**Run record** (one per agent run, stored as a CI artifact and indexed in `agents/runs/index.jsonl`): run ID, agent and spec version, model, git SHA, input artifacts, tools called, tokens, cost, duration, result.

## 7. Risk Tiers and Gates

`planner` proposes a tier. CI raises it automatically from the changed paths, and it can never lower one.

| Tier | Examples | Merge | Production |
|---|---|---|---|
| **0** | Docs, comments, test-only changes | Human approval initially; automatic once earned | Not applicable |
| **1** | Isolated UI, internal tools, non-security dependency patches | One human approval | Automatic after staging passes, once earned |
| **2** | Product logic, API changes, matching and operations rules | One human approval, all agent reviews resolved | Human approval |
| **3** | See below | Human approval plus a specific checklist | Human approval and watched rollout |

**Always Tier 3:** database migrations; auth and session code; tenant isolation; adapter write paths; execution, approval and policy logic; privacy, retention and erasure; payment code; agent permissions and prompts; CI/CD; infrastructure; secrets handling.

**Earning autonomy.** Tier 0 and Tier 1 automatic paths switch on one at a time, by decision in `decisions.md`, after at least 30 consecutive PRs in that tier with no post-merge defect. Any production escape returns that tier to human approval.

**Required CI checks on every PR:** lint, typecheck, unit tests, migration check, secret scan, dependency audit, WI reference, tenant isolation tests, and evals when AI behavior is touched.

## 8. Build Stage

1. `team-lead` selects the next `ready` item with no unfinished dependencies.
2. A new branch and isolated worktree are created: `wi/0123-schedule-import`.
3. `test-writer` writes tests from the acceptance criteria.
4. `implementer` makes them pass, repeating against local checks.
5. `implementer` opens a draft PR with the WI, summary, test evidence and rollback plan.
6. CI and Verify run. Review comments return to `implementer`.
7. After **three** failed fix cycles, or at the run budget, the item is marked `blocked` and handed to a human.

Items run in parallel only when `touches` paths do not overlap. Migrations run one at a time.

## 9. Testing and Quality

| Layer | What it covers | When |
|---|---|---|
| Unit | Domain logic: matching, constraints, policy, ranking; initially the existing SkiMatch regression tests | Every PR |
| Contract | `POSAdapter` suite that every adapter must pass, including Mock and Booking Core | Every PR touching adapters |
| Integration | API with real Postgres, including tenant isolation | Every PR |
| End-to-end | Key flows in a real browser: resolve an issue, approve a plan, complete a booking intake | PR preview for UI changes; staging always |
| Golden scenarios | The seeded school day, such as the instructor absence recovery, as a repeatable regression | Every PR touching operations |
| AI evals | See below | Prompt, model or tool changes; nightly |
| Accessibility and i18n | Automated accessibility checks; EN/FR key parity | Every PR touching UI |

**AI evals** live in `evals/` and must be versioned like tests:

- **Booking agent:** extraction accuracy, preservation of original wording, no invented facts, safe handling of hostile input
- **Manager agent:** answers reflect current state; no claim of actions not taken
- **Plans:** no plan passes with a violated hard constraint. This is a deterministic check, not a judged score.
- **Bias checks:** matching and group placement reviewed for unjustified differences by age, gender and language
- **Model changes:** run the full suite against the old and new model before changing the model policy

## 10. Environments and Deployment

**Proposed platform:** AWS, because `decisions.md` already uses AWS KMS and one vendor simplifies compliance. See PQ-1.

| Environment | Purpose | Data | Access |
|---|---|---|---|
| **Local / worktree** | Development and agent builds | Synthetic seed; mock AI by default | Developers, build agents |
| **Preview** | Per-PR review and QA | Synthetic seed | Team, `qa-agent` |
| **Staging** | Release candidate, production-like | Synthetic data only | Team, `qa-agent`, `release-manager` |
| **Production** | Pilot and customers | Real | Deployment role only; human break-glass with audit |

**Proposed topology:** containers on ECS Fargate for the apps and API, RDS PostgreSQL, S3 for imports, Secrets Manager, KMS with per-environment keys, CloudWatch for logs and alarms, and infrastructure defined with AWS CDK in `infra/`. Region and residency are covered by PQ-2.

**Release flow:**

```text
merge to main
  -> build immutable image (tagged with SHA)
  -> deploy to staging
  -> apply migrations
  -> smoke, end-to-end, golden scenarios
  -> release notes generated
  -> gate per tier (protected GitHub environment)
  -> canary to production -> watch error rate and latency -> full rollout
  -> post-deploy verification
```

**Deployment rules:**

- Staging and production run the same image. Nothing is rebuilt between them.
- Migrations follow expand, migrate, contract, so the previous release keeps working and rollback does not need a schema reversal.
- Production uses `prisma migrate deploy` only, as its own gated step, after a verified backup.
- Risky behavior launches behind per-tenant feature flags, and each pilot school can be enabled independently.
- Avoid high-risk releases during peak operating hours. A freeze window for peak ski days is set in `release-policy.yaml`.
- **Automatic rollback:** the canary rolls back on an error-rate or latency alarm. `release-manager` reports it; a human decides the follow-up.

## 11. Operations

- **Telemetry:** structured logs with PII redaction, traces, metrics, and business signals such as import failures, verification failures, plan approval rates and AI costs.
- **Alerts:** route to a human first. `ops-triage` then attaches recent deployments, suspect changes and a proposed response.
- **Incidents:** a human commands. Agents gather evidence and draft the review, and may not change production. Rollback beyond the automatic canary is a human action.
- **Adapter drift:** nightly checks that import formats still match, with new failures opening a work item.
- **Maintenance:** `dependency-steward` handles updates in small PRs. Security updates raise a priority alert.
- **Backups:** restores are tested on a schedule, because an untested backup is not a recovery plan.
- **Cost:** per-run, per-day and per-environment budgets. `cost-watcher` alerts at 80%, and runs stop at 100%.

## 12. Security and Data Boundaries

**Agents never receive:** production data, production secrets, tenant POS credentials, payment credentials, or card data.

**Controls:**

- Short-lived, least-privilege credentials per run, through GitHub OIDC rather than stored cloud keys
- Tool allowlists per agent, enforced by the runner configuration
- Build agents run in isolated environments with restricted network egress
- Secret scanning before push and in CI
- CODEOWNERS requires human review of `agents/`, `.github/`, `infra/`, `packages/db/prisma/` and policy code
- Branch protection on `main`: PR required, checks required, no force-push, no agent bypass

**Prompt injection.** Issues, PR comments, web pages, import files, dependency code and customer text are untrusted data. Agents that read them can't act on them with elevated privileges. Workflows triggered from external input run with read-only tokens and no secrets. A human must approve runs on PRs from outside the team.

**Test data.** Real pilot data never flows down to lower environments. Fixtures are synthetic, based on the SkiMatch school-day seed. A pilot import that reveals a new edge case gets recreated synthetically.

**Runtime agents are separate.** The booking and manager agents are product features and use the product's constraints and approval flow. They share no credentials with the development agents.

## 13. Repository Layout

```text
agents/
  README.md                 how the pipeline works
  policy.yaml               models, budgets and permissions
  specs/
    product/  design/  plan/  build/  verify/  release/  operate/
  pipelines/                pipeline definitions, including existing generate and review
  scripts/                  promote.sh and validators
  archive/                  original/ and second/ moved here
.github/
  workflows/                pr-checks, agent-*, deploy-staging, deploy-production, evals-nightly
  CODEOWNERS
  pull_request_template.md
design-docs/                existing product and technical docs, including this file
work/                       work items
evals/                      datasets, scenarios and scoring
infra/                      AWS CDK app
runbooks/                   incident, rollback, restore
release-policy.yaml         tier path rules, freeze windows and flags
```

## 14. Runner and Model Policy

**Runner:** Claude Agent SDK driven from GitHub Actions, plus local runs through Claude Code. GitHub Actions supplies triggers, isolation, logs, OIDC and protected environments without a custom orchestration service. See PQ-3.

**Triggers:**

| Event | Action |
|---|---|
| Merged source-doc change | Generate and Review pipelines |
| Work item set to `ready` | Build |
| PR opened or updated | CI, then Verify agents |
| Merge to `main` | Staging deployment and release preparation |
| Nightly | Evals, dependency check, adapter drift, costs |
| Alert | `ops-triage` |
| Weekly | `retro-analyst` |

**Model policy** is set once, in `agents/policy.yaml`, replacing the per-file pinning:

| Class | Use | Model |
|---|---|---|
| `deep` | Orchestration, code review, security, complex implementation | `claude-opus-5-5` |
| `standard` | Design documents, implementation, tests, planning | `claude-sonnet-5-5` |
| `fast` | Validators, triage, summaries | `claude-haiku-5-5` |

Specs name a class, not a model. Changing a class's model is a Tier 3 change that requires an eval run.

## 15. Failure Handling

| Situation | Response |
|---|---|
| Agent fails or times out | One automatic retry, then `blocked` with its run record |
| Fix loop not converging | Stop at three cycles; hand to human |
| Reviewers disagree | Security reviewer wins for blocking; a human resolves the rest |
| Requirement unclear | Add an open question; block the item |
| Spec and code conflict | Stop; never silently change the spec to match the code |
| Budget reached | Stop and save the state |
| Staging fails | Block the release; open a work item |
| Production issue after release | Canary rollback or human rollback, then a review with a regression test |

## 16. Pipeline Metrics

- Lead time from `ready` to production
- Share of PRs merged without human code changes
- Agent review findings confirmed real, and false-positive rate
- Change failure rate and time to restore
- Production escapes by tier
- Cost per merged work item
- Blocked-item rate and reasons

## 17. Rollout

Each step delivers value by itself. The pipeline must not delay Phase 0 and Phase 1 of the product, so steps 1 and 2 happen alongside the SkiMatch move, and later steps follow what the product actually needs.

| Step | Deliverables | Done when |
|---|---|---|
| **1. Harden design pipeline** | `promote.sh` honors READY/HOLD; archive old specs; central model policy; rerun design pipeline for the overlay | A HOLD file cannot be promoted |
| **2. CI foundation** | `test` task in Turborepo, PR checks, branch protection, CODEOWNERS | A failing PR cannot merge |
| **3. Plan and build** | Work item format, `planner`, `implementer`, `test-writer`, on Phase 0 migration work | First agent-built PR merged with human review |
| **4. Verify** | Reviewers, `spec-auditor`, evals, golden scenarios | Reviewers run on every PR |
| **5. Environments** | CDK, staging, preview, `qa-agent`, staging deployment | Merge reaches staging automatically |
| **6. Production** | Production environment, gates, canary, rollback, runbooks, privacy controls | Tested rollback and restore, required before the first real import |
| **7. Operate and learn** | `ops-triage`, cost and dependency agents, `retro-analyst` | Weekly retro produces useful changes |
| **8. Earned autonomy** | Automatic paths for Tier 0, then Tier 1 | Criteria in section 7 met |

## 18. Open Questions

| ID | Question | Recommendation |
|---|---|---|
| **PQ-1** | AWS or Vercel for hosting? SkiMatch's demo is on Vercel. | AWS for production. Vercel previews are acceptable while data is synthetic. |
| **PQ-2** | Is Canadian data residency required for pilot schools, and is a region per country needed? | Get legal advice before the first Canadian pilot; start in `ca-central-1` if a Canadian school is first. |
| **PQ-3** | Is GitHub Actions enough as the runner? | Yes, until concurrency or run length makes it a bottleneck. |
| **PQ-4** | Which LLM provider serves runtime product features? The prototype uses OpenAI, while the pipeline uses Claude. | Keep the provider interface and decide using evals. |
| **PQ-5** | Who is the human approver and on-call for a solo team during ski season? | Name them before the first real import; a single approver is a real availability risk. |
| **PQ-6** | Can a solo maintainer satisfy both "author never approves" and required human review? | Yes, as agents author and the human approves. Human-authored Tier 3 changes need a separate reviewer or a recorded exception. |
| **PQ-7** | What monthly budget limit applies to agent runs? | Set before step 3, adjusted from early run records. |
| **PQ-8** | Do work items stay in `work/`, or move to GitHub Issues or Linear? | Stay in the repo so agents and humans share one versioned source. |
