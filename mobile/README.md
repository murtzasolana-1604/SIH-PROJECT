# Sahkaar Connect — Android Mobile Application

**Smart India Hackathon (SIH 2026)**  
**Problem Statement ID**: SIH26089  
**Title**: Cooperative Gig Services Platform for Household & Community Services  
**Organization**: Ministry of Cooperation / National Council for Cooperative Training (NCCT)  
**Live Production Backend**: `https://sih-project-v7qg.onrender.com`  
**Database**: Managed PostgreSQL on Render  
**Mobile Framework**: React Native 0.76 + Expo SDK 52 + TypeScript  

---

## 1. Overview & Architecture

The **Sahkaar Connect** Android application is a native mobile client built strictly within the `mobile/` directory. It extends the existing cooperative gig platform to millions of citizens and blue-collar cooperative workers across India.

### Architecture Highlights:
- **Zero Local SQLite Lock-in**: All mobile operations communicate via REST APIs with the persistent PostgreSQL backend deployed on Render.
- **Strict Credential Separation**: No database credentials, secrets, or `DATABASE_URL` exist inside the mobile codebase.
- **Cooperative Fair-Wage Guarantee**: Transparent 85% living wage direct worker payout with 15% cooperative welfare & PMSBY insurance reserve.
- **True Bilingual Experience**: Instant reactive switching between English and Hindi across 100% of screens.
- **Voice-Enabled AI Assistant**: Sahkaar Saathi voice and text assistant for hands-free local service dispatch.

```
       +---------------------------------------------+
       |   Sahkaar Connect Android Mobile App        |
       |  (Expo 52, React Native 0.76, TypeScript)   |
       +---------------------------------------------+
                              |
                     HTTPS / JSON REST
                              |
                              v
       +---------------------------------------------+
       |       Node.js + Express Backend API         |
       |     https://sih-project-v7qg.onrender.com   |
       +---------------------------------------------+
                              |
                     pg connection pool
                              |
                              v
       +---------------------------------------------+
       |     Render Managed PostgreSQL Database      |
       +---------------------------------------------+
```

---

## 2. Directory Structure

```
mobile/
├── App.tsx                      # Root component with providers & role navigation
├── app.json                     # Expo configuration (package: com.sahkaarconnect.app)
├── eas.json                     # EAS Build profiles (preview -> APK, production -> AAB)
├── package.json                 # React Native, Expo 52, Lucide/Ionicons, AsyncStorage
├── tsconfig.json                # Strict TypeScript configuration
├── .env.example                 # EXPO_PUBLIC_API_URL template
├── components/
│   ├── common/                  # Reusable UI widgets (Button, Input, Card, Header, RatingStars, etc.)
│   ├── customer/                # Citizen UI components (ServiceCard, WorkerCard, BookingCard)
│   └── worker/                  # Worker UI components (JobCard, EarningsCard, WelfareCard)
├── constants/
│   ├── config.ts                # API URLs, demo credentials, timeouts, SLAs
│   ├── theme.ts                 # Cooperative color palette, spacing, typography
│   └── translations.ts          # Complete EN and HI bilingual dictionary
├── context/
│   ├── AuthContext.tsx          # Dual-role session & JWT persistence
│   ├── LanguageContext.tsx      # Reactive language state manager
│   └── NetworkContext.tsx       # Render health check & cold-start handling
├── screens/
│   ├── SplashScreen.tsx         # Launch screen with SIH26089 metadata & server ping
│   ├── RoleSelectScreen.tsx     # Citizen vs Cooperative Worker entry
│   ├── customer/                # 10 Dedicated Citizen Screens
│   │   ├── CustomerLoginScreen.tsx
│   │   ├── CustomerOtpScreen.tsx
│   │   ├── CustomerOnboardingScreen.tsx
│   │   ├── CustomerHomeScreen.tsx
│   │   ├── ServiceWorkersScreen.tsx
│   │   ├── WorkerDetailScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── CustomerBookingsScreen.tsx
│   │   ├── BookingDetailScreen.tsx
│   │   ├── EmergencySosScreen.tsx
│   │   ├── SahkaarSaathiScreen.tsx
│   │   └── CustomerProfileScreen.tsx
│   └── worker/                  # 9 Dedicated Worker Screens
│       ├── WorkerLoginScreen.tsx
│       ├── WorkerOtpScreen.tsx
│       ├── WorkerOnboardingScreen.tsx
│       ├── WorkerDashboardScreen.tsx
│       ├── WorkerJobsScreen.tsx
│       ├── WorkerJobDetailScreen.tsx
│       ├── WorkerEarningsScreen.tsx
│       ├── WorkerWelfareScreen.tsx
│       └── WorkerProfileScreen.tsx
└── services/
    ├── api.ts                   # Centralized HTTP client with timeout & bearer auth
    ├── auth.ts                  # Customer & worker OTP auth endpoints
    ├── location.ts              # GPS location detection & distance calculator
    ├── storage.ts               # Local persistence via AsyncStorage
    └── voice.ts                 # Bilingual voice query simulation & STT helpers
```

---

## 3. Prerequisites

- **Node.js**: `v18.x` or `v20.x`
- **npm** or **yarn**
- **Expo Go App**: Install from Google Play Store on your Android device (for instant testing)
- **EAS CLI** (Optional, for building APK / AAB):
  ```bash
  npm install -g eas-cli
  ```

---

## 4. Local Development & Running the App

### Step 1: Install Dependencies
Open your terminal and navigate to the `mobile/` directory:
```bash
cd mobile
npm install
```

### Step 2: Configure Environment
Copy the `.env.example` file:
```bash
cp .env.example .env
```
*(The default `EXPO_PUBLIC_API_URL` is already pre-configured to `https://sih-project-v7qg.onrender.com`)*.

### Step 3: Start the Expo Development Server
```bash
npm start
# OR
npx expo start
```

### Step 4: Run on Android

#### Option A: Run on Physical Android Phone via Expo Go (Fastest & Easiest)
1. Open the **Expo Go** app on your Android smartphone.
2. Ensure your phone and PC are connected to the same Wi-Fi (or use `npx expo start --tunnel`).
3. Scan the QR code displayed in the terminal.
4. The Sahkaar Connect Android app will load immediately on your device.

#### Option B: Run on Android Emulator
```bash
npm run android
```

---

## 5. How to Build Standalone APK & Production AAB

The project includes a fully configured `eas.json` for building Android installation packages without requiring a local Android Studio build environment.

### 1. Log in to your Expo account:
```bash
npx eas-cli login
```

### 2. Configure project with EAS:
```bash
npx eas-cli project:init
```

### 3. Generate Installable Testing APK (`preview` profile):
This generates a direct `.apk` file that can be downloaded and installed directly on any Android smartphone:
```bash
npx eas-cli build --platform android --profile preview
```
*The build output link will provide a direct download link for `sahkaar-connect-preview.apk`.*

### 4. Generate Production Android App Bundle (`production` profile):
This generates a signed `.aab` file ready for submission to the Google Play Store Console:
```bash
npx eas-cli build --platform android --profile production
```

---

## 6. Demo Accounts & Credentials

For evaluators, hackathon judges, and test users:

| Role | Mobile Number | Demo OTP | Notes |
|---|---|---|---|
| **Citizen / Customer** | `9876543210` | `123456` | Has pre-existing bookings & addresses |
| **Cooperative Worker** | `9876543210` | `123456` | Certified Electrician, Delhi Metro Co-op |

*Any 10-digit mobile number can also be used; entering `123456` on the OTP screen will verify seamlessly.*

---

## 7. Dual-Role Features & Capabilities

### For Citizens / Customers:
1. **Frictionless OTP Authentication**: Quick 10-digit phone login with auto-fill demo button.
2. **Cooperative Service Discovery**: Transparent pricing for Electrician, Plumber, Carpenter, Cleaning, Painting, and Appliance Repair.
3. **Verified Worker Directory**: View NCCT cooperative trust badges, experience, ratings, and member societies.
4. **Instant Fair-Wage Booking**: Select date, time slot, service address, and view transparent 85/15 living wage breakdown.
5. **1-Click Emergency SOS Dispatch**: Rapid emergency request targeting a 15-minute response SLA for critical hazards (water burst, electrical sparks).
6. **Sahkaar Saathi AI Assistant**: Bilingual voice and text assistant for scheduling jobs and receiving co-op rate advice.
7. **Complete Lifecycle Tracking & UPI Settlement**: Real-time status updates (Pending -> Scheduled -> In Progress -> Completed), tax invoice download, and 1-5 star feedback.

### For Cooperative Workers:
1. **Duty On / Off Availability Toggle**: Real-time toggle synced directly to the backend (`POST /api/workers/:id/availability`).
2. **Job Management Lifecycle**: Full visibility of incoming requests with one-tap Accept, Start (on-site check-in), and Complete actions.
3. **85/15 Living Wage Transparency**: Real-time earnings dashboard displaying:
   - 85% Direct living wage payout.
   - 10% Worker welfare & PMSBY insurance allocation.
   - 5% Platform operations & dispatch network.
4. **Instant Payout Settlement**: One-click transfer of completed job earnings to registered bank accounts.
5. **Pradhan Mantri Suraksha Bima Yojana (PMSBY)**:
   - ₹2,00,000 accidental death & disability insurance policy certificate with SHA-256 hash.
   - Premium 100% sponsored by the cooperative welfare reserve.
6. **Emergency Relief Fund Claims**: Submit distress relief claims (medical emergencies, tool damage) directly to the Cooperative Welfare Committee (`POST /api/welfare/claims`).

---

## 8. Backend API Mapping

All network calls are strictly directed to `https://sih-project-v7qg.onrender.com`:

| Function | Method | Endpoint | Description |
|---|---|---|---|
| Server Health | `GET` | `/api/status` | Database connection status & latency |
| Customer OTP Send | `POST` | `/api/auth/customer/send-otp` | Generates customer verification OTP |
| Customer OTP Verify | `POST` | `/api/auth/customer/verify-otp` | Validates OTP and returns JWT token |
| Worker OTP Send | `POST` | `/api/auth/worker/send-otp` | Generates worker verification OTP |
| Worker OTP Verify | `POST` | `/api/auth/worker/verify-otp` | Validates worker OTP and returns JWT |
| Get Services | `GET` | `/api/services` | Fetches services with live base pricing |
| Get Workers | `GET` | `/api/workers` | Fetches verified NCCT cooperative workers |
| Get Bookings | `GET` | `/api/bookings` | Fetches bookings list |
| Create Booking | `POST` | `/api/bookings` | Creates a new citizen service booking |
| Update Status | `POST` | `/api/bookings/:id/status` | Updates status (`confirmed`, `in_progress`, `completed`) |
| Submit Rating | `POST` | `/api/bookings/:id/rate` | Citizen 1-5 star rating and review |
| Emergency SOS | `POST` | `/api/emergency/request` | Dispatches 15-minute emergency alert |
| AI Chatbot | `POST` | `/api/chatbot/message` | Sahkaar Saathi bilingual LLM assistant |
| Worker Availability | `POST` | `/api/workers/:id/availability` | Toggles worker duty On / Off |
| Worker Earnings | `GET` | `/api/workers/:id/earnings` | 85/15 living wage calculations |
| Worker Welfare | `GET` | `/api/welfare/worker/:id` | PMSBY insurance certificate & claims |
| Welfare Claims | `POST` | `/api/welfare/claims` | Submits emergency relief grant claim |

---

## 9. Ministry of Cooperation & SIH Compliance

Sahkaar Connect Android App adheres strictly to:
- **National Policy on Cooperatives**: Democratic control, economic worker participation, and zero platform exploitation.
- **Fair Living Wages**: Mandated 85% worker revenue share, outperforming commercial aggregators that deduct 25-35%.
- **Digital NCCT Badging**: Identity verification preventing unauthorized contractors.
- **Accessibility & Inclusion**: Designed with high-contrast UI, $\ge 48\text{px}$ touch targets, and full Hindi vernacular support for workers with varying literacy levels.
