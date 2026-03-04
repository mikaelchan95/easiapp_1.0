# Tech Debt Audit

**Audited:** March 5, 2026

---

## Critical — Broken Config

### 1. `jest.config.js` — Wrong Property Name

**File:** `jest.config.js`

Uses `moduleNameMapping` instead of the correct Jest property `moduleNameMapper`. This means `@/` path aliases silently fail in all tests.

**Fix:** Rename the property:

```js
// Before
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/app/$1',
},

// After
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/app/$1',
},
```

### 2. `test:integration` Script References Non-Existent Files

**File:** `package.json`

The `test:integration` script references two test files that don't exist:

- `app/services/__tests__/realTimePaymentIntegration.test.ts`
- `app/services/__tests__/enhancedCheckoutService.test.ts`

Running `npm run test:integration` will fail.

**Fix:** Either create the test files or remove the script.

---

## High — 500-Line Rule Violations

The project rule (`.cursor/rules/refactor.mdc`) requires refactoring files that approach or exceed 500 lines. **58 files** currently violate this rule, with an additional 21 files in the 400–499 range.

### Top Offenders (1,000+ lines)

| File                                                  | Lines | Over by |
| ----------------------------------------------------- | ----: | :-----: |
| `app/services/supabaseService.ts`                     | 2,781 |  5.6x   |
| `app/components/Location/UberStyleLocationPicker.tsx` | 1,845 |  3.7x   |
| `app/context/AppContext.tsx`                          | 1,558 |  3.1x   |
| `app/components/Profile/ProfileScreen.tsx`            | 1,261 |  2.5x   |
| `app/components/Rewards/VoucherTrackingScreen.tsx`    | 1,203 |  2.4x   |
| `app/components/Location/DeliveryLocationPicker.tsx`  | 1,199 |  2.4x   |
| `app/context/RewardsContext.tsx`                      | 1,171 |  2.3x   |
| `app/components/Products/ProductDetailScreen.tsx`     | 1,167 |  2.3x   |
| `app/components/Location/AddressDetailsForm.tsx`      | 1,163 |  2.3x   |
| `App.tsx`                                             | 1,080 |  2.2x   |
| `app/services/googleMapsService.ts`                   | 1,096 |  2.2x   |
| `app/services/pointsService.ts`                       | 1,068 |  2.1x   |
| `app/components/Profile/TeamManagementScreen.tsx`     | 1,009 |  2.0x   |
| `app/components/Rewards/RewardsScreen.tsx`            | 1,004 |  2.0x   |

### 500–999 Lines (44 files)

| File                                                  | Lines |
| ----------------------------------------------------- | ----: |
| `app/components/Location/SavedLocationsScreen.tsx`    |   970 |
| `app/components/Billing/InvoiceGeneration.tsx`        |   871 |
| `app/components/Activities/OrderHistoryScreen.tsx`    |   803 |
| `app/components/Checkout/CheckoutScreen.tsx`          |   798 |
| `app/components/Activities/SupportScreen.tsx`         |   784 |
| `app/components/Profile/CompanyProfileScreen.tsx`     |   782 |
| `app/components/Checkout/UnifiedCheckoutScreen.tsx`   |   776 |
| `app/components/Profile/SettingsScreen.tsx`           |   751 |
| `app/components/Rewards/RewardsAnalyticsScreen.tsx`   |   743 |
| `app/components/Location/LocationBottomSheet.tsx`     |   722 |
| `app/components/Checkout/OrderSuccessScreen.tsx`      |   712 |
| `app/components/Activities/ReviewsScreen.tsx`         |   701 |
| `app/services/enhancedBillingService.ts`              |   700 |
| `app/components/Billing/InvoiceViewer.tsx`            |   693 |
| `app/components/Location/LocationSelectionUI.tsx`     |   682 |
| `app/components/Checkout/DeliveryStep.tsx`            |   672 |
| `app/services/realTimePaymentService.ts`              |   667 |
| `app/components/Billing/BillingSettings.tsx`          |   662 |
| `app/components/Cart/CartScreen.tsx`                  |   661 |
| `app/components/Rewards/ReferralScreen.tsx`           |   657 |
| `app/components/Billing/PaymentHistory.tsx`           |   655 |
| `app/components/Billing/BillingDashboard.tsx`         |   650 |
| `app/services/companyBillingService.ts`               |   636 |
| `app/components/Rewards/MilestonesScreen.tsx`         |   636 |
| `app/components/Checkout/OrderProcessingScreen.tsx`   |   623 |
| `app/components/Billing/CreditPaymentScreen.tsx`      |   599 |
| `app/components/Location/EnhancedLocationPicker.tsx`  |   594 |
| `app/components/Billing/PartialPaymentScreen.tsx`     |   587 |
| `app/components/Location/DeliveryLocationHeader.tsx`  |   577 |
| `app/components/Checkout/ReviewStep.tsx`              |   567 |
| `app/components/Auth/SignInScreen.tsx`                |   559 |
| `app/components/UI/SmartSearchDropdown.tsx`           |   554 |
| `app/components/UI/ProductCard.tsx`                   |   551 |
| `app/components/Billing/CreditAlertsNotification.tsx` |   550 |
| `app/components/Checkout/OrderTrackingScreen.tsx`     |   548 |
| `app/components/Billing/PaymentAllocationPreview.tsx` |   541 |
| `app/components/Billing/InvoicesList.tsx`             |   537 |
| `app/components/Billing/CompanyCreditOverview.tsx`    |   530 |
| `app/components/Rewards/RewardsFAQScreen.tsx`         |   529 |
| `app/components/Location/LocationSuggestionsList.tsx` |   527 |
| `app/services/supabaseAuthService.ts`                 |   526 |
| `app/components/Home/PastOrdersSection.tsx`           |   513 |
| `app/components/Checkout/OrderConfirmationScreen.tsx` |   511 |
| `app/components/Billing/RealTimeBalanceWidget.tsx`    |   505 |

### Approaching Limit (400–499 lines, 21 files)

`CheckoutDeliverySection.tsx` (499), `InviteFriendsScreen.tsx` (493), `LocationPicker.tsx` (488), `AchievementsScreen.tsx` (481), `MonthlyOverview.tsx` (479), `CheckoutPaymentSection.tsx` (478), `AddressStep.tsx` (477), `animations.ts` (476), `ChatScreen.tsx` (474), `ActivitiesScreen.tsx` (469), `ReferralHistoryScreen.tsx` (460), `CalendarView.tsx` (447), `CartItem.tsx` (444), `SignUpScreen.tsx` (429), `CompanyInvoicesScreen.tsx` (427), `AnimatedFeedback.tsx` (426), `FeaturedProduct.tsx` (421), `PaymentStep.tsx` (416), `EnhancedProductCard.tsx` (413), `BillingDashboard.test.tsx` (408), `PointsHistoryModal.tsx` (406)

### Recommended Refactoring Priority

1. **`supabaseService.ts` (2,781 lines)** — Split into domain modules: `userService.ts`, `orderService.ts`, `teamService.ts`, `locationService.ts`, `seedService.ts`. Keep a thin re-export facade.
2. **`AppContext.tsx` (1,558 lines)** — Extract reducer logic, side effects, and auth logic into separate files.
3. **`App.tsx` (1,080 lines)** — Extract screen registration, tab bar config, and provider wrapper into separate files.
4. **`RewardsContext.tsx` (1,171 lines)** — Extract voucher logic and rewards catalog into a service or sub-context.
5. **Location components** — Consolidate duplicates (see Dead Code section below).

---

## High — Location Component Duplication

`app/components/Location/` contains 25 files with significant overlap. Several components appear to be unused dead code:

| Component                    | Lines | Status                                                      |
| ---------------------------- | ----: | ----------------------------------------------------------- |
| `LocationPicker.tsx`         |   488 | **Not imported anywhere**                                   |
| `LocationPickerModal.tsx`    |    61 | **Not imported anywhere**                                   |
| `LocationPickerEnhanced.tsx` |   248 | **Not imported anywhere**                                   |
| `LocationScreen.tsx`         |   119 | Only used by the unused `LocationPickerEnhanced`            |
| `DeliveryLocationPicker.tsx` | 1,199 | Only used by `DeliveryLocationScreen`                       |
| `DeliveryLocationScreen.tsx` |    44 | Route exists but app uses `UberStyleLocationScreen` instead |

**Active flow:** `UberStyleLocationScreen` → `UberStyleLocationPicker` (1,845 lines, also needs refactoring)

**Recommendation:** Remove unused location components and refactor `UberStyleLocationPicker` into smaller composable pieces.

---

## Medium — ~150+ `console.log` Statements in Production Code

Debug logging left in production code across the app (excluding `testSupabaseIntegration.ts` which is intentional).

### Biggest Contributors

| File                                                  | Approx. Count |
| ----------------------------------------------------- | :-----------: |
| `app/services/supabaseService.ts`                     |      ~50      |
| `app/context/AppContext.tsx`                          |      ~20      |
| `app/components/Profile/TeamManagementScreen.tsx`     |      ~10      |
| `app/services/storageService.ts`                      |      ~8       |
| `app/components/Location/UberStyleLocationPicker.tsx` |      ~6       |
| `App.tsx`                                             |      ~6       |
| `app/components/Activities/OrderHistoryScreen.tsx`    |      ~6       |
| `app/components/Activities/WishlistScreen.tsx`        |      ~4       |
| `app/services/supabaseAuthService.ts`                 |      ~3       |
| `app/services/auditService.ts`                        |      ~3       |
| _(+ many more files with 1–3 each)_                   |               |

**Recommendation:** Replace with a proper logging utility that can be silenced in production builds, or wrap in `__DEV__` checks.

---

## Medium — ESLint Underutilized

**File:** `.eslintrc.js`

The config uses `@typescript-eslint/parser` but doesn't extend any TypeScript rules. The following packages are installed as devDependencies but not configured:

- `eslint-config-expo` — not in `extends`
- `@typescript-eslint/eslint-plugin` — not in `plugins` or `extends`
- `eslint-plugin-react-hooks` — not in `plugins`

**Recommended extends:**

```js
extends: [
  'eslint:recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:react/recommended',
  'plugin:react-hooks/recommended',
  'expo',
],
```

---

## Medium — Unused Service Files

| Service                              | Reason                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| `app/services/mcpStripeService.ts`   | Not imported anywhere in the app                                   |
| `app/services/mcpSupabaseService.ts` | Not imported anywhere in the app                                   |
| `app/services/storageService.ts`     | Not imported; app uses `supabaseService.uploadProfileImageFromUri` |

**Recommendation:** Remove if not planned for future use, or mark with a clear comment about intended use.

---

## Medium — Type Suppression Comments

| Location                         | Count | Type               |
| -------------------------------- | :---: | ------------------ |
| `App.tsx`                        |   2   | `@ts-ignore`       |
| `admin-web/src/pages/` (various) |  22   | `@ts-expect-error` |

The `admin-web` suppressions are concentrated in Dashboard, CompanyDetail, Invoices, Customers, Orders, CompanyInvoices, CustomerDetail, and OrderDetail pages — likely due to Supabase query result typing.

---

## Low — Unused Dependencies

| Package                            | Reason                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `expo-router`                      | Not imported anywhere; app uses React Navigation. Also listed in `app.json` plugins unnecessarily. |
| `react-native-svg-transformer`     | No `metro.config.js` configures it; no `.svg` file imports exist                                   |
| `@react-native-community/blur`     | Not imported anywhere                                                                              |
| `react-native-geolocation-service` | Not imported; app uses `expo-location` instead                                                     |

**Recommendation:** Remove all four and remove `expo-router` from `app.json` plugins.

---

## Low — Stale Configuration References

| Item                             | Location                  | Issue                                                                                                                        |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `app/data/**` coverage exclusion | `jest.config.js` line 17  | Directory doesn't exist                                                                                                      |
| Commented-out screen types       | `app/types/navigation.ts` | Defines types for `LocationPickerDemo`, `MomentumShowcase`, `TierBenefitsScreen`, `AdminBillingDashboard`, etc. — none exist |
| `expo-router` plugin             | `app.json` line 42        | Not used                                                                                                                     |

---

## Low — TODO Comments

| File                                              | Line | Content                                                    |
| ------------------------------------------------- | ---- | ---------------------------------------------------------- |
| `app/context/RewardsContext.tsx`                  | 1203 | `// TODO: Fix company loading issue and re-enable`         |
| `app/components/Rewards/CompanyPointsSection.tsx` | 37   | `// TODO: Navigate to full company points dashboard`       |
| `app/services/supabaseService.ts`                 | 701  | `// TODO: In a full implementation, you'd also:`           |
| `app/services/supabaseService.ts`                 | 1910 | `// TODO: Create points_audit table in database migration` |

---

## Low — Empty Catch Blocks

| File                                               | Line    | Note                                 |
| -------------------------------------------------- | ------- | ------------------------------------ |
| `app/components/Billing/RealTimeBalanceWidget.tsx` | 84–86   | Comment says "Silent error handling" |
| `app/components/Location/LocationPicker.tsx`       | 100–102 | Haptics not available on all devices |
| `app/components/Location/LocationPicker.tsx`       | 168–169 | Haptics not available on all devices |

---

## Suggested Priority Order

1. **Fix `jest.config.js`** — one-line fix, unblocks test infrastructure
2. **Fix or remove `test:integration` script** — prevents CI failures
3. **Remove unused dependencies** — reduces bundle size and install time
4. **Remove dead location components** — eliminates ~2,000+ lines of dead code
5. **Split `supabaseService.ts`** — largest single file, hardest to maintain
6. **Add proper logging utility** — replace 150+ console.logs
7. **Strengthen ESLint config** — catch more bugs automatically
8. **Refactor remaining 500+ line files** — ongoing effort, tackle by severity
