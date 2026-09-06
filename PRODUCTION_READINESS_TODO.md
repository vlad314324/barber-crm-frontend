# Frontend production-readiness TODO

## Purpose and baseline

Implement the frontend portion of the production-readiness review dated 2026-09-06. This is an execution backlog, not a claim that the application is ready. All tasks start open; only these planning files have been created.

- Repository: `barber-crm-frontend`
- Reviewed commit: `d5a5b3929f0dfff2956cb7b49bec67f4e878e316`
- Companion backlog: [backend TODO](../barber-crm-api/PRODUCTION_READINESS_TODO.md)
- Stack: React 18, TypeScript, Vite 5, React Router 7, Axios, Tailwind, Vercel static deployment.
- Review result: **Not ready**. Production bundling passed, but type checking failed and critical backend protections were missing. Browser behavior was inspected in source, not exercised in a live browser.

## Instructions for the implementing agent

1. Read current repository instructions and inspect the working tree. Revalidate referenced behavior because code may have changed since the review. Source paths and symbols are navigation aids, not immutable line references.
2. Implement only the tasks assigned to you, preserving unrelated user changes. Follow the suggested ordering and coordinate backend dependencies rather than guessing response shapes.
3. Check a task only when all acceptance criteria are met. Record commands, browser scenarios, outcomes, and limitations in its evidence field. Distinguish mocked browser tests from real staging integration.
4. Frontend route guards, hidden buttons, and slot checks are user experience controls, not authorization or reservation enforcement. Do not mark backend security/data-integrity tasks complete after a frontend-only fix.
5. Use synthetic data and disposable local/staging services. Do not exercise mutation flows against an existing deployment or expose secrets. Keep fixture credentials and personal data out of commits and screenshots.
6. Mark external verification as `BLOCKED: <missing access/evidence>` when needed, leaving the checkbox open. Missing staging access is not a passed acceptance criterion.
7. Preserve localization, theme behavior, responsive layouts, and separation between the public booking client, salon authentication, and platform authentication. A redesign or framework migration is outside this backlog.

Priorities: **P0** = release blocker; **P1** = required before broad rollout or small pre-release repair; **P2** = contained follow-up. A disabled feature can be an explicit temporary constraint, not an implicit completion claim.

Suggested order: FE-08 baseline/type repairs and FE-03 keyboard work; coordinate FE-01/02 with backend authorization/session work. Complete FE-04/05 and reservation integration before public release. Align FE-06 contracts, then verify FE-07 onboarding. Implement FE-09 alongside bounded backend APIs; resolve FE-10 before operating with real customer data.

## Tasks

### [ ] FE-01 — Align permission-aware UI and revoked-session behavior

- **Priority:** P0 integration gate. **Review:** F01/F02, confirmed backend defects. **Effort:** M.
- **Inspect:** `src/App.tsx`; `src/components/ProtectedRoute.tsx`; `src/components/Sidebar.tsx`; `src/utils/roleRoutes.ts`; `src/context/AuthContext.tsx`; `src/api/index.ts`; calendar lookup callers.
- **Implementation:** Consume the backend permission matrix and current-user DTO. Keep route/navigation/action visibility consistent. Handle revoked/inactive sessions without retaining privileged UI state. Distinguish a legitimate 403 operation denial from an expired session. Preserve the minimal lookup data required by barber workflows after backend field/permission restrictions.
- **Acceptance:** Administrators and barbers reach their intended workflows, direct protected URLs behave correctly, and deactivated/demoted sessions recover predictably. Public booking and platform sessions remain independent. UI controls never imply a forbidden server operation is available.
- **Verify:** Browser role matrix covering login, direct navigation, reload, deactivation, demotion, permission denial, and tenant mismatch; staging checks with actual backend authorization.
- **Depends on:** BE-01, BE-02. **Evidence:** Pending.

### [ ] FE-02 — Repair restored-user identity and password change

- **Priority:** P1; small pre-release repair. **Review:** F11, confirmed. **Effort:** S.
- **Inspect:** `src/context/AuthContext.tsx`; `src/pages/Settings.tsx`; auth types and API client.
- **Problem:** `/auth/me` currently returns `_id`, but the form reads `user.id`; password change fails after reload.
- **Implementation:** Consume one normalized user DTO across login, registration, and session restoration. Update self-service password change to the backend's authenticated-identity contract. Handle the post-change session policy deliberately instead of assuming the old token remains usable.
- **Acceptance:** Login → page reload → password change succeeds. Missing identity cannot be silently sent as a malformed request. Old credentials and sessions behave according to the backend revocation policy; the new credentials can authenticate.
- **Verify:** Browser integration tests for fresh and restored sessions, incorrect current password, validation failure, successful update, and subsequent login.
- **Depends on:** BE-02, BE-10. **Evidence:** Pending.

### [ ] FE-03 — Make public booking accessible and integrate authoritative reservations

- **Priority:** P0. **Review:** F03/F04/F05/F14. **Effort:** M–L.
- **Inspect:** `src/pages/BookingPage.tsx`; `src/api/types.ts`; `src/i18n/bookingTranslations.ts`.
- **Problem:** Menu/employee/service controls are click-only `div`s. Slot filtering uses the browser clock; selected slot state can outlive employee/service changes. Booking submits without an idempotency contract.
- **Implementation:** Replace interactive `div`s with appropriate native controls; associate labels and expose selected state. Consume the explicit public employee DTO and salon timezone. Invalidate/revalidate the date/time selection after employee or duration changes. Handle conflict responses by refreshing availability and directing the user to a new slot. Use the backend idempotency contract so retrying an uncertain submission reuses its key, while an intentionally changed booking receives a new key. Send the selected language only under an agreed supported-language contract.
- **Acceptance:** The complete booking journey works by keyboard and screen reader; selection state is announced; no private employee fields are needed. The confirmation screen uses the accepted server result. An uncertain response or double click cannot create duplicate reservations. Server conflicts and invalid schedules have actionable recovery.
- **Verify:** Keyboard-only and screen-reader walkthrough; mobile viewport; slow/failed/retried submission; changed employee/services after slot choice; real backend overlap rejection; browser timezone different from salon timezone. Check every offered booking language and document any email-language limitation.
- **Depends on:** BE-03, BE-04, BE-05 for API integration. Keyboard work can start independently. **Evidence:** Pending.

### [ ] FE-04 — Keep calendar and history usable with archived or missing references

- **Priority:** P0 integration gate. **Review:** F07, confirmed. **Effort:** M.
- **Inspect:** `src/pages/Appointments.tsx` (`apptsByBarber`, `openEdit`); `src/pages/ClientDetails.tsx`; `src/pages/Dashboard.tsx`; deletion actions; appointment/reference types.
- **Problem:** `typeof value === 'object'` treats `null` as an object, so populated missing client/employee references can crash calendar/history interactions.
- **Implementation:** Model nullable/archived references accurately and render useful historical fallbacks. Guard edit actions requiring a live entity. Align deletion/archive controls with the backend policy; keep existing appointments visible rather than silently filtering broken records away.
- **Acceptance:** Orphaned legacy records do not crash pages. Archived entities remain intelligible in history and cannot be selected for new bookings unless explicitly allowed. Failed deletion produces an actionable message and does not remove local state optimistically as though it succeeded.
- **Verify:** Fixtures and browser tests with deleted/archived clients, employees, and services across past/future appointments, calendar selection, edit forms, client history, and dashboard views.
- **Depends on:** BE-07 for lifecycle contract. Defensive rendering can start independently. **Evidence:** Pending.

### [ ] FE-05 — Add reliable loading, error, cancellation, and retry states

- **Priority:** P1; complete before broad rollout. **Review:** F13, confirmed. **Effort:** M.
- **Inspect:** `src/pages/BookingPage.tsx` catalog/availability effects; `src/pages/Settings.tsx` initial fetch; `src/pages/Appointments.tsx` `fetchAll`; `src/pages/Dashboard.tsx`; `src/api/index.ts`; `src/api/platformApi.ts`.
- **Problem:** Rejected reads can leave indefinite loading or render empty data; late responses can replace current availability; some errors are only logged.
- **Implementation:** Represent loading, loaded-empty, failed, and stale states separately. Cancel obsolete requests or ignore their responses using request identity. Clear/invalidate old slots during a changed selection. Add actionable retry behavior and bounded request waiting. Handle 401, 403, 409, 429, and server/network failures distinctly. Do not automatically retry non-idempotent mutations.
- **Acceptance:** Failed requests never imply an empty business calendar or zero successful data. Settings leaves loading on failure. Out-of-order responses cannot overwrite a newer employee/date selection. Recovery preserves safe user input and does not duplicate actions.
- **Verify:** Browser tests with offline mode, delayed/out-of-order responses, 500, timeout, 429, expired sessions, and retries for each critical screen.
- **Coordinate:** BE-04 idempotency, BE-08 rate limits. **Evidence:** Pending.

### [ ] FE-06 — Preserve review text across create and reload

- **Priority:** P2; fix before offering review entry, or disable it. **Review:** F12, confirmed. **Effort:** S.
- **Inspect:** `src/pages/Employees.tsx` review submission/display; `src/api/types.ts` `Review`/`CreateReviewDto`; `src/api/index.ts` review client.
- **Problem:** Submission/display use `comment`, while storage uses `text`; the DTO also requires an appointment that the form does not supply.
- **Implementation:** Adopt the agreed canonical field and appointment-reference requirement. Align form, types, API response, and display; remove unreachable/unimplemented review client operations if no caller or supported contract needs them.
- **Acceptance:** A nonempty review survives submit, fetch, and page reload. The review form type-checks without assertions that hide a missing required field. Errors leave the user's draft available for recovery.
- **Verify:** Contract test and browser create/reload test using nonempty text; required-field and failure cases.
- **Depends on:** BE-11. **Evidence:** Pending.

### [ ] FE-07 — Verify registration and recovery journeys under partial failure

- **Priority:** P1; onboarding release condition. **Review:** Provisioning/recovery evidence gaps. **Effort:** M.
- **Inspect:** `src/pages/RegisterSalon.tsx`; `src/pages/Login.tsx`; `src/pages/ForgotPassword.tsx`; `src/pages/ResetPassword.tsx`; auth context/API contracts.
- **Implementation:** Integrate backend provisioning retry/state semantics. Preserve nonsecret form input after recoverable failures, present expired/used invitation states correctly, and avoid reporting failure as proof that no salon was created after an interrupted response. Verify reset-link and session behavior after credential changes.
- **Acceptance:** Valid, expired, used, and mismatched invitations have clear outcomes. Interrupted registration can recover without duplicate creation or an unrecoverable UI loop. Password recovery does not disclose account existence, and expired/used reset links have a clear restart path.
- **Verify:** Staging end-to-end registration/login and forgot/reset flows with delayed/lost responses and backend-injected provisioning failures. Use only synthetic recipients and local/staging email capture.
- **Depends on:** BE-02, BE-10, BE-15. **Evidence:** Pending; real failure recovery not exercised in the review.

### [ ] FE-08 — Repair type errors and enforce release checks

- **Priority:** P0 assurance gate. **Review:** F15, confirmed. **Effort:** M.
- **Inspect:** `package.json`; TypeScript/ESLint/Vite configuration; `src/components/LanguageToggle.tsx`; `src/components/Layout.tsx`; appointment status and review form types.
- **Implementation:** Fix the five baseline TypeScript errors without weakening strictness or hiding contract mismatches. Make app/config type checks and lint mandatory before production bundling. Add meaningful automated coverage for booking, role/session behavior, password changes, review persistence, missing-reference rendering, and failure recovery. Use the lockfile and document the supported runtime; add checked-in CI configuration if absent.
- **Acceptance:** A clean disposable environment can reproduce installation, type checking, lint, tests, and production build. Critical failures block release. Warnings are reviewed and documented rather than treated as evidence of readiness. Production API configuration cannot silently ship the localhost fallback.
- **Verify:** Run clean release commands; check emitted bundle configuration without exposing secrets; verify Vercel deep-link routing for booking, reset, and CRM pages. Complete a dependency advisory audit and triage applicable issues.
- **Coordinate:** BE-12. **Evidence:** Pending.

### [ ] FE-09 — Consume bounded data APIs and protect shared dialog interaction

- **Priority:** P1 for growing tenants; dialog repairs before broad rollout. **Review:** F10/F14. **Effort:** M.
- **Inspect:** Calendar/client/report loaders and API clients; `src/components/Modal.tsx`; import/export controls.
- **Implementation:** Fetch only the visible date range/page and server-computed statistics after bounded APIs are available. Keep filtering/sorting/count semantics correct across pages. Show import/export progress, limits, and partial failures. Add shared dialog semantics, an accessible close name, Escape handling, focus containment/restoration, and background interaction control using the project's existing approach.
- **Acceptance:** Large tenant history does not have to be loaded to show a day or page. Pagination and range changes remain correct under slow responses. Keyboard focus stays in an open modal and returns to its invoker on close; errors and long-running actions remain operable.
- **Verify:** Representative large-dataset browser tests and network payload inspection; paginated search/sort; repeated modal open/close; keyboard focus and partial import failure scenarios.
- **Depends on:** BE-16 for bounded APIs. Dialog work can start independently. **Evidence:** Pending.

### [ ] FE-10 — Verify client-side personal-data sharing and retention expectations

- **Priority:** P1 operating-policy gate. **Review:** Privacy evidence gaps. **Effort:** S–M.
- **Inspect:** `src/pages/ClientDetails.tsx` external avatar URL; other external image/map requests; Vercel analytics/speed instrumentation; auth/local storage usage and error reporting.
- **Problem:** Client details send customer names to an external avatar service. The review did not establish approved processor/data-sharing policy or deployed telemetry behavior.
- **Implementation:** Inventory actual outbound personal-data flows with synthetic fixtures. Remove unnecessary sharing, such as generating initials locally instead of requesting name-based avatars. Align remaining telemetry, remote assets, deletion expectations, and session cleanup with the documented product data policy. Do not add a generic consent flow without an established requirement.
- **Acceptance:** No unnecessary customer identifiers are embedded in third-party asset URLs. Documented required processors and telemetry payloads match observed browser requests. Credentials/reset tokens and personal form data do not appear in application logs or unintended telemetry.
- **Verify:** Browser network/log inspection using synthetic clients, login/reset URLs, and error cases; record sanitized results and links to the agreed policy.
- **Coordinate:** BE-17. **Evidence:** Pending; deployed telemetry/privacy controls unverified.

## Original verification baseline

- Node `v24.19.0`, npm `11.17.0` in the review environment; these are observations, not a selected production runtime.
- `./node_modules/.bin/eslint .`: 0 errors, 8 warnings (seven Fast Refresh export warnings and one appointment effect dependency warning).
- `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json`: failed with five errors:
  - `src/components/LanguageToggle.tsx:56` and `:76`: string is not assignable to `Lang`.
  - `src/components/Layout.tsx:1`: unused React import.
  - `src/pages/Appointments.tsx:892`: string is not assignable to the appointment status union.
  - `src/pages/Employees.tsx:251`: review creation is missing required `appointment`.
- `./node_modules/.bin/tsc --noEmit -p tsconfig.node.json`: passed.
- In-memory Vite production build (`build({ build: { write: false } })`): passed, 1,747 modules transformed, no output artifacts emitted. The normal build does not run TypeScript checking.
- 282 installed package versions matched corresponding lockfile entries; no clean installation was attempted.
- `npm audit --json --ignore-scripts`: failed because `registry.npmjs.org` could not resolve; no clean dependency-security result exists.
- No test runner was configured. Browser, screen-reader, real API integration, and load tests were not run.

## Frontend release handoff

- [ ] All P0 tasks have implementation and verification evidence.
- [ ] Public booking works with keyboard, screen reader, mobile viewport, slow network, conflict recovery, and retry-safe submission.
- [ ] Fresh/restored/revoked sessions and password recovery pass against the corrected backend.
- [ ] Missing-reference fixtures and read failures do not crash screens or masquerade as valid empty data.
- [ ] CI type/lint/test/build checks pass; advisory audit and deployment configuration are verified.
- [ ] Frontend/backend contract changes and release ordering agree with the companion backlog.
- [ ] Remaining P1/P2 work and disabled-feature constraints are explicitly recorded; no frontend-only change is credited as a backend security fix.
