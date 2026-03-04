# AutoCount User -> App Schema Mapping (Draft v1)

Date: 2026-03-04  
Scope: mapping AutoCount user/access concepts to this app's Supabase schema.

## 1) Is app schema available in project files?

Yes.

1. Legacy reference schema: `app/database/schema.sql`
2. Current authoritative schema: `supabase/migrations/*.sql`

For integration work, treat migrations as source of truth.

Primary tables relevant to user mapping:

1. `users` (base): `supabase/migrations/20250101000000_create_base_schema.sql`
2. `user_permissions`: `supabase/migrations/20250101000000_create_base_schema.sql`
3. `companies`: `supabase/migrations/20250101000000_create_base_schema.sql`
4. Additional user columns:
   - `wallet_balance`: `20250711053750_add_wallet_balance_to_users.sql`
   - `points`: `20250715000000_create_points_system.sql`
   - `is_admin`: `20251207000000_add_admin_orders_access.sql`

## 2) Mapping matrix (AutoCount user/access -> app schema)

| AutoCount concept                                    | App table.column                                                     | Mapping type    | Notes                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| User Login ID (`EASIBRIDG`)                          | Not stored by default                                                | Runtime config  | Keep in bridge service secrets/env vars, not in `public.users`.             |
| User Password                                        | Not stored                                                           | Runtime secret  | Never store in app DB.                                                      |
| User Name                                            | `users.name`                                                         | Optional mirror | Only if you intentionally sync identities. Not required for bridge runtime. |
| User Group (`INTEGRATION`)                           | `users.role` + `user_permissions.*`                                  | Derived         | App has role + boolean permissions, not AutoCount group objects.            |
| Access right: `Create A/R Invoice Entry`             | `user_permissions.can_manage_billing`                                | Approximate     | App has no document-level AR right granularity.                             |
| Access right: `Edit A/R Invoice Entry`               | `user_permissions.can_manage_billing`                                | Approximate     | Same limitation as above.                                                   |
| Access right: `View/Open A/R Invoice Entry`          | `user_permissions.can_view_reports` (or read policies)               | Approximate     | Read rights are policy-driven in Supabase + app role logic.                 |
| Access right: `Show/Open AR Debtor Maintenance`      | `companies` table access                                             | Conceptual      | Debtor in AutoCount maps business-wise to company/debtor record mapping.    |
| Access right: `Show/Open Credit Term Maintenance`    | `companies.payment_terms`                                            | Direct field    | Terms exist in app company profile.                                         |
| Access right: `Show/Open Payment Method Maintenance` | `company_payments.payment_method`, `invoice_payments.payment_method` | Value mapping   | No dedicated payment-method master table in app schema.                     |
| Access right: `Show/Open Account Maintenance`        | No direct equivalent                                                 | Gap             | App has no GL account master table.                                         |
| Access right: `Show/Open Account Inquiry`            | No direct equivalent                                                 | Gap             | App has billing/order dashboards, not GL inquiry modules.                   |

## 3) Important non-1:1 gaps

1. No `tax master` table (`Tax Type Maintenance` equivalent is absent).
2. No GL account master/inquiry tables.
3. App permissions are coarse (`role` + boolean flags), while AutoCount rights are function-level.

## 4) Recommended integration identity model

Use separate identities for each system:

1. AutoCount service user: managed in AutoCount only (`INTEGRATION` group).
2. App bridge identity: service-role key + bridge secrets (outside `public.users`).
3. Optional human operator in app: `users.is_admin = true` for admin-web operations.

Do not attempt to force full AutoCount user-right parity into `public.users`/`user_permissions`.

## 5) Minimal mapping decisions to lock before coding

1. Whether to mirror AutoCount service account into `public.users` (recommended: no).
2. Which app role/flag can trigger manual retry (`is_admin` or `can_manage_billing`).
3. Single source of truth for debtor-company link:
   - Proposed: maintain `company_id <-> autocount_debtor_code` mapping in bridge config (new table).
