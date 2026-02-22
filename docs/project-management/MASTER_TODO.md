# Master To-Do List

Central backlog for cross-cutting project tasks and operational fixes.

## Architecture / Platform / Tooling

### A1) Fix `admin-web/apply_migration.js` to use current Supabase Management API

- **Status**: Pending
- **Priority**: High
- **Owner**: Unassigned
- **Created**: 2026-02-19

#### Issue
- The migration helper script currently posts to deprecated endpoint:
  - `POST /v1/projects/{ref}/query`
- Current Supabase Management API SQL endpoint is:
  - `POST /v1/projects/{ref}/database/query`
- Result: script returns `404 Not Found`, so SQL cannot be applied from this helper.

#### Why this should be fixed
- Prevents reliable one-command SQL execution for targeted fixes.
- Increases operational risk by forcing ad-hoc manual/API workarounds.
- Slows incident response when schema hotfixes are needed.
- Causes team confusion (appears like permissions/safety restriction when it is an endpoint mismatch).

#### Scope of fix
- Update `admin-web/apply_migration.js` endpoint to `/database/query`.
- Keep auth model (`SUPABASE_ACCESS_TOKEN`) unchanged.
- Improve error output to include response status + body (already mostly present, keep/strengthen).
- Add a short usage note in docs for required env vars and expected success response.

#### Acceptance criteria
- Running `node admin-web/apply_migration.js` with valid env vars executes SQL successfully.
- Script receives HTTP `201` and no longer returns `Cannot POST /v1/projects/<ref>/query`.
- A sample idempotent SQL file runs without manual dashboard intervention.
- Documentation references the correct endpoint and required env vars.

#### Notes from recent incident
- Root issue encountered in app: `public.app_settings` missing (`PGRST205`).
- Immediate workaround succeeded by calling `/database/query` directly and creating/seeding `app_settings`.
- This backlog item captures the permanent tooling fix so future SQL runs are straightforward.

## Business Logic / App Flows

### B1) Investigate mobile app logout button no-op (no handler logs)

- **Status**: Pending
- **Priority**: High
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- In the mobile app, tapping the logout button appears to do nothing.
- No expected console output is emitted from the logout handler path.
- Symptom suggests the press event is not reaching the handler (or is blocked before handler execution).

#### Why this should be fixed
- Users cannot reliably sign out, which blocks account switching and creates session confusion.
- Missing handler logs make incident triage slower and increase debugging time.
- Authentication UX reliability is a core requirement for both testing and production usage.

#### Scope of fix
- Verify `ProfileScreen` logout button wiring (`onPress`, disabled state, touch target, z-index/overlay interactions).
- Add temporary instrumentation to confirm press event and handler entry point.
- Trace `ProfileScreen` -> `AppContext.signOut` -> auth state listener path to identify where execution stops.
- Implement root-cause fix only after confirmation, then remove temporary debug noise.

#### Acceptance criteria
- Tapping logout consistently triggers the handler and emits expected logs at each key stage.
- App transitions to auth screen after logout under normal and fallback sign-out paths.
- No regressions in profile header interactions or loading state behavior.
- Logs are concise and production-appropriate after verification.

#### Notes from latest report
- Reproduced report from user: button tap has no visible effect and no logout-related console logs.
- Item is tracked first; implementation deferred until active debugging begins.

### B2) Investigate duplicate "Add to cart" confirmation popups

- **Status**: Pending
- **Priority**: Medium
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Tapping "Add to cart" triggers two confirmation popups instead of one.
- Duplicate confirmations create noisy UX and may indicate duplicate event handling.

#### Why this should be fixed
- Duplicate popups reduce trust in cart actions and make the app feel unstable.
- Repeated confirmations can lead users to think the item was added multiple times.
- Likely points to duplicated listeners/handlers that could affect other interactions.

#### Scope of fix
- Trace add-to-cart flow from product UI trigger through cart notification layer.
- Identify where duplicate popup invocation occurs (double onPress, duplicate dispatch, or repeated side effect subscription).
- Ensure confirmation popup is emitted once per successful add action.
- Add guard or deduplication at the correct layer to prevent repeat notifications.

#### Acceptance criteria
- One tap on "Add to cart" shows exactly one confirmation popup.
- Cart quantity and totals remain correct with no double-add side effects.
- No regressions for add-to-cart feedback in product list and product detail screens.
- Behavior is consistent across iOS, Android, and web (where applicable).

#### Notes from latest report
- User observed two confirmation popups for a single add-to-cart action.
- Item is tracked for investigation before implementation.

### B3) Investigate cart button no-op from Product Details page

- **Status**: Pending
- **Priority**: High
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Cart button does not work when triggered from the Product Details screen flow.
- Behavior is inconsistent versus add-to-cart behavior from other entry points.

#### Why this should be fixed
- Blocks purchase flow from a high-intent screen.
- Creates user confusion and increases checkout drop-off risk.

#### Scope of fix
- Trace Product Details CTA handlers to cart state dispatch and navigation updates.
- Verify route params/state propagation between Product Details and Cart.
- Ensure button action and feedback are consistent with product list/cart entry points.

#### Acceptance criteria
- Cart action from Product Details consistently updates cart and opens/reflects cart state.
- No regressions in existing add-to-cart flows.

## UI / UX / Interaction Reliability

### U1) Investigate non-functional search bar

- **Status**: Pending
- **Priority**: Medium
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Search bar is visible but does not produce expected search behavior/results.

#### Acceptance criteria
- User input updates results (or expected filter state) in real time or on submit.

### U2) Fix images/assets not loading correctly

- **Status**: Pending
- **Priority**: High
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Product/profile/media assets fail to load or render inconsistently.

#### Acceptance criteria
- Assets load reliably with appropriate fallbacks/placeholders where required.

### U3) Investigate profile picture functionality issues

- **Status**: Pending
- **Priority**: Medium
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Profile picture update/display functionality is incomplete or broken.

#### Acceptance criteria
- User can update profile picture and see it persist correctly across app reloads.

### U4) Fix support center interaction failures and crashes

- **Status**: Pending
- **Priority**: High
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Live chat button does nothing.
- Profile -> Support -> "Browse by topic" buttons crash the app.

#### Acceptance criteria
- Live chat CTA triggers intended in-app support flow.
- Browse-by-topic buttons no longer crash and navigate/render safely.

### U5) Evaluate in-app email support experience

- **Status**: Pending
- **Priority**: Medium
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- Current email support redirects to external mail app; desired direction is in-app support composition.

#### Acceptance criteria
- Product decision finalized (external vs in-app).
- If approved, in-app email support flow is implemented and connected.

### U6) Fix FAQ "Helpful" (thumbs-up) button no-op

- **Status**: Pending
- **Priority**: Low
- **Owner**: Unassigned
- **Created**: 2026-02-20

#### Issue
- FAQ helpful thumbsup action does nothing when tapped.

#### Acceptance criteria
- Helpful action provides visible feedback and records interaction where applicable.
