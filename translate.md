# Implementation Plan: Profile Overlap Fix, Dedicated Profile Page & Full Translation Support

Comprehensive plan to eliminate top bar text overlap, implement an accessible avatar dropdown using a disclosure pattern, launch a dedicated Citizen Profile page (`/profile`) with secure dynamically masked registry data, and implement full bilingual i18n support (English & Hindi) across the navigation, profile, and dashboard.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions & Audit Confirmations**:
> 1. **Backend `/api/auth/me` Audit & Dynamic ID Masking**:
>    - **Confirmed**: `/api/auth/me` returns `dateOfBirth`, `gender`, `phone`, `primaryAddress`, `district`, `state`, `pincode`, and `identityMap` (`identityDeptId`, `revenueDeptId`, `educationDeptId`, `transportDeptId`, etc.).
>    - **Security Enhancement**: To prevent raw departmental IDs from ever traversing the network to the browser, `/api/auth/me` in `auth.routes.ts` will dynamically mask the IDs on the backend (e.g. `SIM-AADHAAR-XXXX-${id.slice(-4)}` and `SIM-PAN-XXXX-${id.slice(-4)}`). Masks are computed dynamically from actual data, never hardcoded.
> 2. **JWT Decoding & Session Status**:
>    - JWT payloads and headers will be decoded using a robust base64url converter (handling `-`, `_`, and dynamic `=` padding) wrapped in `try/catch`.
>    - The token is retrieved from `localStorage` (`govlink_token`).
>    - The cryptographic algorithm (`alg`) will be read directly from the JWT header rather than hardcoded.
>    - The UI will display **"Session active, expires [Date/Time]"** (or **"Session expired"** if `exp * 1000 < Date.now()`). It will not claim client-side cryptographic verification.
> 3. **Data Mapping Scope & Known Limitations**:
>    - **Gender**: Localized via a robust mapper supporting `MALE`, `male`, `M`, `Male` → `पुरुष` / `Male` (and equivalent for Female/Other), falling back to the raw value if unmapped.
>    - **State & District**: Left in English as dynamic data (explicitly documented as an intentional scope boundary).
>    - **Application Statuses**: Mapped dynamically in both English and Hindi (`SUBMITTED`, `ACTIVE`, `FAILED`, `APPROVED`).
>    - **Missing Data & Admin Profile**: Missing/null values (common for Admin accounts or unlinked citizens) will gracefully render as an em-dash (`—`), and missing registry links will display a clean "No departmental registries linked" notice.
> 4. **Translation Scope Boundary**:
>    - **Translated in this pass**:
>      - Navigation Bar (desktop & mobile drawer with full breakpoint handling)
>      - Profile Dropdown menu and user summary card
>      - New Profile Page (`ProfilePage.tsx`)
>      - Public Login Page (`LoginPage.tsx` with floating language toggle)
>      - Dashboard headers, counters, search bar, and status pills (`DashboardPage.tsx`)
>      - Plain Audit Trail (`AuditNarrativePage.tsx`, already translated)
>    - **Kept in English for this pass**:
>      - `ServicesPage`, `ConsentPage`, `AuditPage`, `DataExportPage`, `OpsPage`, `AdminOnboardingPage`, `AdminAppealsPage`.

---

## Open Questions

None currently blocking. All items from technical review have been addressed.

---

## Proposed Changes

### 1. Typography & Devanagari Self-Hosting

#### [MODIFY] [packages/frontend/package.json](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/package.json)
- Add `@fontsource/noto-sans-devanagari` to dependencies (ensuring privacy-focused, zero third-party tracking, fully offline-capable gov font loading).

#### [MODIFY] [global.css](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/styles/global.css)
- Import `@fontsource/noto-sans-devanagari`.
- Update font stack:
  ```css
  font-family: 'Inter', 'Noto Sans Devanagari', system-ui, sans-serif;
  ```
- Add dedicated Devanagari line-height rule:
  ```css
  :lang(hi) {
    line-height: 1.6;
  }
  ```

---

### 2. Internationalization (i18n) Setup & Complete Dictionary Parity

#### [MODIFY] [index.ts](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/i18n/index.ts)
- Set `fallbackLng: 'en'`.
- Synchronize `<html lang="...">`:
  - Set on initial load: `document.documentElement.lang = i18n.language || 'en'`.
  - Listen for changes: `i18n.on('languageChanged', (lng) => { document.documentElement.lang = lng; })`.
- Add dev-only `missingKeyHandler` to log any untranslated keys directly in the console.

#### [MODIFY] [en.json](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/i18n/en.json) & [hi.json](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/i18n/hi.json)
Ensure **100% identical key parity** with no empty values:
- **`nav.*`**:
  - `dashboard`, `services`, `myConsents`, `auditTrail`, `myData`, `ops`, `registry`, `appeals`
  - `profile`: "My Profile" / "मेरी प्रोफ़ाइल"
  - `privacyConsents`: "Consent & Privacy" / "सहमति और गोपनीयता"
  - `downloadDossier`: "Download Dossier" / "डेटा दस्तावेज़ डाउनलोड करें"
  - `language`: "Language" / "भाषा"
  - `signOut`: "Sign out" / "लॉग आउट"
  - `copyId`: "Copy ID" / "आईडी कॉपी करें"
  - `copied`: "Copied!" / "कॉपी किया गया!"
  - `online`: "Active" / "सक्रिय"
  - `userMenuAria`: "User profile menu" / "उपयोगकर्ता प्रोफ़ाइल मेनू"
- **`profile.*`**:
  - `title`, `subtitle`, `citizenBadge`, `adminBadge`, `verifiedCitizen`
  - `demographicsTitle`, `fullName`, `dob`, `gender`, `phone`, `email`, `address`, `district`, `state`, `pincode`
  - `genderMale`: "Male" / "पुरुष", `genderFemale`: "Female" / "महिला", `genderOther`: "Other" / "अन्य"
  - `registryTitle`, `registrySubtitle`, `aadhaarRef`, `panRef`, `academicRef`, `transportRef`, `statusLinked`, `statusUnlinked`, `noRegistries`
  - `consentTitle`, `consentSubtitle`, `activeConsents`, `revokedConsents`, `manageConsents`, `consentLoadWarning`
  - `securityTitle`, `securitySubtitle`, `authMode`, `algorithm`, `sessionActive`, `sessionExpired`, `sessionExpires`, `exportDossier`
  - `loadingProfile`, `errorLoadingProfile`, `retryButton`
- **`dashboard.*`**:
  - `title`, `subtitle`, `newApp`, `total`, `eligible`, `completed`, `inProgress`, `search`
  - `filterAll`, `filterSubmitted`, `filterActive`, `filterFailed`
  - `statusSubmitted`: "Submitted" / "जमा किया गया"
  - `statusActive`: "In Progress" / "प्रक्रियाधीन"
  - `statusFailed`: "Failed" / "विफल"
  - `statusApproved`: "Approved" / "स्वीकृत"
- **`login.*`**:
  - `languageToggleAria`: "Switch language" / "भाषा बदलें"

---

### 3. Backend Dynamic Masking for `/api/auth/me`

#### [MODIFY] [auth.routes.ts](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/backend/src/gateway/auth.routes.ts)
- Compute dynamic masks from actual database strings so raw internal silo IDs never appear in client HTTP responses:
  ```ts
  const maskedIdentityMap = citizen.identityMap ? {
    identityDeptId: citizen.identityMap.identityDeptId ? `SIM-AADHAAR-XXXX-${citizen.identityMap.identityDeptId.slice(-4)}` : null,
    revenueDeptId: citizen.identityMap.revenueDeptId ? `SIM-PAN-XXXX-${citizen.identityMap.revenueDeptId.slice(-4)}` : null,
    educationDeptId: citizen.identityMap.educationDeptId ? `SIM-EDU-XXXX-${citizen.identityMap.educationDeptId.slice(-4)}` : null,
    transportDeptId: citizen.identityMap.transportDeptId ? `SIM-DL-XXXX-${citizen.identityMap.transportDeptId.slice(-4)}` : null,
  } : null;
  ```

---

### 4. Top Bar Profile Avatar & Accessible Disclosure Dropdown

#### [MODIFY] [Nav.tsx](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/components/layout/Nav.tsx)
- **Compact Avatar Button**:
  - Shows 2-letter initials (e.g. `RK`) on accent circle with green active dot.
  - Disclosure attributes: `aria-expanded={isOpen}`, `aria-controls="profile-dropdown-panel"`, `aria-label={t('nav.userMenuAria')}`.
- **Accessible Dropdown Popover**:
  - `id="profile-dropdown-panel"`.
  - Positioned with `right: 0` and `max-width: calc(100vw - 24px)`.
  - Outside-click listener using `pointerdown` (touch + mouse).
  - Keyboard listener: Closes on `Escape` key and returns focus to the avatar button.
  - **Menu Items with Lucide Icons** (no emojis):
    - Header: Full name, role badge (`CITIZEN` / `ADMIN`), state, OneGov ID with copy button.
    - Copy ID fallback: Catches rejected `navigator.clipboard.writeText` promise and falls back to `document.execCommand('copy')`, resetting the "Copied!" label after 2000ms.
    - Option 1: `<User size={15} />` **{t('nav.profile')}** (`/profile`).
    - Option 2: `<Languages size={15} />` **{t('nav.language')}** (toggles `en` ⇄ `hi`).
    - Option 3: `<FileDown size={15} />` **{t('nav.downloadDossier')}** (`/data-export`).
    - Option 4: `<Shield size={15} />` **{t('nav.privacyConsents')}** (`/consent-dashboard`).
    - Option 5: `<LogOut size={15} />` **{t('nav.signOut')}** (red hover).
- **Responsive Layout & Mobile Drawer**:
  - Tablet (`md` 768px–1024px): Secondary links collapse gracefully to maintain breathing room for longer Hindi labels.
  - Mobile Drawer (`< 768px`): Fully translated, includes User summary, My Profile, Language switcher, Consent & Privacy, Download Dossier, and Sign Out.
- **Route Validation**:
  - Verified route links: `/profile`, `/dashboard`, `/services`, `/consent-dashboard`, `/my-history`, `/data-export`.

---

### 5. Public Language Toggle on Login Page

#### [MODIFY] [LoginPage.tsx](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/pages/LoginPage.tsx)
- Add top-right floating language switch button using `i18n.changeLanguage()`.
- Supports pre-login language switching with immediate Devanagari text updates.

---

### 6. Dedicated Citizen Profile Page (`/profile`)

#### [NEW] [ProfilePage.tsx](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/pages/ProfilePage.tsx)
- **Resilient Data Fetching**:
  - Invokes `api.getMe()` and `api.getAllConsents()`.
  - Skeleton loader during loading.
  - If `getMe()` fails: Full error view with retry button.
  - If `getAllConsents()` fails but `getMe()` succeeds: Profile page loads smoothly; consent card displays non-blocking warning with retry option.
- **Card 1: Identity & Demographics**:
  - Full Name, OneGov ID with copy button.
  - Localized DOB: `Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-IN').format(new Date(dob))`.
  - Localized Gender: Normalized mapping (`MALE`/`male`/`M` → `पुरुष` / `Male`).
  - Masked Phone: `+91 98XXX XX210` (or `—` if null).
  - Email address, Full Address, District, State, Pincode (with `—` for null fields).
- **Card 2: Federated Registries (Masked)**:
  - Displays masked IDs: UIDAI Aadhaar, Income Tax PAN, APAAR Academic ID, Transport DL.
  - Clean "No departmental registries linked" notice if user has no registry map.
- **Card 3: Privacy & Consent Governance**:
  - Active & Revoked consent counters.
  - Direct button to `/consent-dashboard`.
- **Card 4: Security & Session Status**:
  - Decoded base64url JWT payload (`header.alg`, `payload.exp`).
  - Displays "Session active, expires [Date/Time]" or "Session expired".
  - If token expires while on page, highlights expired status with prompt to re-authenticate.
  - Quick action links: `/data-export` and `/my-history`.

---

### 7. Application Routing

#### [MODIFY] [App.tsx](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/App.tsx)
- Add `<Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />`.

---

### 8. Dashboard Multilingual Integration

#### [MODIFY] [DashboardPage.tsx](file:///home/aayushchoudhary/Downloads/Class/One_Gov/packages/frontend/src/pages/DashboardPage.tsx)
- Wire `useTranslation()` to titles, subtitles, counters, filter tabs, search placeholder, and application status badges.

---

## Verification Plan

### Automated Verification
1. **Automated i18n Parity Check Script (`npm run i18n:check`)**:
   Add to `packages/frontend/package.json`:
   ```bash
   "i18n:check": "node scripts/check-i18n-parity.js"
   ```
   Script validates:
   - Guards against `typeof null === 'object'`.
   - Checks that every key in `en.json` is present in `hi.json` and vice-versa.
   - Flags any empty strings (`""`) in `hi.json`.
2. **Frontend Type Check & Build**:
   ```bash
   cd packages/frontend && npm run build
   ```

### Manual Verification
1. **Top Bar & Dropdown Test Matrix**:
   - Test at `1440px`, `1024px`, and `768px` in both English and Hindi.
   - Test with extra-long citizen name (e.g. `"Dr. Shri Ramachandran Venkatanarasimharajuvaripeta"`) and OneGov ID in Hindi to ensure zero text overflow.
   - Test `Escape` key navigation (closes menu, returns focus to avatar).
   - Test `pointerdown` outside click on touch and mouse.
   - Test copy ID fallback when `navigator.clipboard` is unavailable.
2. **Profile Page Scenarios**:
   - **Citizen Persona**: Verify all personal details, masked IDs, and active session expiry.
   - **Admin Persona**: Verify graceful rendering with em-dashes for absent citizen/registry fields.
   - **Consent Service Failure Simulation**: Block `/api/consent/citizen` in network tab; verify profile still renders with warning on consent card.
   - **Token Expiry**: Test behavior with expired token.
3. **Translation Switch**:
   - Toggle on public login page and verify Hindi translation.
   - Log in, toggle language in dropdown, verify immediate updates to Nav, Profile, and Dashboard.
   - Verify `document.documentElement.lang` updates to `hi` and `en`.
