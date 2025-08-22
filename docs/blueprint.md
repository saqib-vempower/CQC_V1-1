
# Call Quality Compass - Technical Blueprint

## 1. Project Overview

Call Quality Compass is a Next.js 15 web application designed for auditing university admissions calls. It leverages Firebase for backend services and Genkit with Google's Gemini 2.5 Pro and Assembly AI for advanced AI-powered call analysis.

## 2. Authentication and Roles

*   **Firebase Authentication:** Handles user sign-up and login with email and password.
*   **User Roles:**
    *   **Admin:** Manages users, system settings, and has full access to all QA functionalities.
    *   **QA:** Can upload and review calls, view team performance, and access the main tool.
    *   **Agent:** Can only view their own performance and recent audit results.
*   **First User as Admin:** The first user to sign up will be automatically assigned the 'Admin' role. Subsequent users will be assigned the 'Agent' role by default, and can be promoted by an Admin.

## 3. Data Models (Firestore)

*   **/users/{userId}**
    *   `uid`: string (from Firebase Auth)
    *   `email`: string
    *   `role`: 'Admin' | 'QA' | 'Agent'
    *   `displayName`: string

*   **/calls/{callId}**
    *   `fileName`: string (AgentName_ApplicantID.mp3)
    *   `storagePath`: string (path to audio file in Cloud Storage)
    *   `university`: 'CUA' | 'RIT' | 'IIT' | 'SLU' | 'DPU' | 'RU'
    *   `domain`: 'Reach' | 'Connect' | 'Support'
    *   `callType`: 'inbound' | 'outbound'
    *   `callDate`: timestamp (optional)
    *   `agentId`: string (links to /users/{userId})
    *   `applicantId`: string
    *   `status`: 'Uploaded' | 'Transcribing' | 'Metrics' | 'Scored' | 'Error'
    *   `createdAt`: timestamp
    *   `updatedAt`: timestamp

*   **/calls/{callId}/transcript**
    *   `fullText`: string
    *   `utterances`: array of objects `{speaker: string, text: string, start: number, end: number}`

*   **/calls/{callId}/metrics**
    *   `talkTime`: object `{agent: number, applicant: number}`
    *   `responseGaps`: number
    *   `holds`: number
    *   `overlaps`: number
    *   `politeClarifications`: number
    *   `namePronunciationAsked`: boolean
    *   `channelQuality`: number

*   **/calls/{callId}/score**
    *   `rubricVersion`: string
    *   `overallScore`: number (weighted total)
    *   `criteria`: array of objects `{criterion: string, score: number | 'N/A', weight: number, evidence: string, timestamp: number, notes: string}`

## 4. Project Structure

```
.
├── .env.local
├── .firebaserc
├── .gitignore
├── README.md
├── apphosting.yaml
├── components.json
├── firebase.json
├── firestore.rules
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── public/
├── src/
│   ├── ai/
│   │   ├── flows/
│   │   │   ├── analyze-call-transcript.ts
│   │   │   ├── export-to-sheets.ts
│   │   │   ├── generate-coaching-tips.ts
│   │   │   ├── score-rubric.ts
│   │   │   ├── store-call-record.ts
│   │   │   └── transcribe-audio.ts
│   │   └── genkit.ts
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   ├── agent/
│   │   │   │   └── page.tsx
│   │   │   ├── qa/
│   │   │   │   └── page.tsx
│   │   │   ├── audits/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx  // Landing Page
│   ├── components/
│   │   ├── cqc/
│   │   │   ├── auth-provider.tsx
│   │   │   ├── call-upload-form.tsx
│   │   │   ├── header.tsx
│   │   │   └── ... (other custom components)
│   │   └── ui/
│   │       └── ... (ShadCN UI components)
│   ├── hooks/
│   │   └── ... (custom hooks)
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── utils.ts
│   └── styles/
│       └── fonts.ts
└── tailwind.config.ts
```

## 5. Frontend (Next.js)

*   **Landing Page (`/`):** Explains the tool with a "Login / Get Started" button.
*   **Login Page (`/login`):** Email/password form using Firebase Auth.
*   **Dashboards:**
    *   **Admin (`/admin`):** User statistics and system health.
    *   **QA (`/qa`):** Calls for review and team performance.
    *   **Agent (`/agent`):** Personal performance and recent audits.
*   **Main Tool (`/audits`):**
    *   Upload form for MP3 files with metadata.
    *   File naming enforcement: `AgentName_ApplicantID.mp3`.
    *   Status chips for tracking call processing.
*   **Results Page (`/audits/[id]`):**
    *   **Transcript Tab:** Colored by speaker.
    *   **Metrics Tab:** Tables for objective metrics.
    *   **Score Tab:** Rubric table with scores, evidence, and notes.
*   **List Page:** Filterable list of all calls.
*   **Styling:** Tailwind CSS with a navy/light blue palette and the Inter font. ShadCN components for UI elements.

## 6. AI Backend (Genkit)

*   **`transcribe-audio` flow:**
    1.  Triggered by a new file in the "uploads" Cloud Storage bucket.
    2.  Calls Assembly AI or Gemini's audio transcription with diarization and timestamps.
    3.  Stores the transcript in Firestore (`/calls/{callId}/transcript`).
    4.  Updates call status to 'Transcribing'.
*   **`analyze-call-transcript` flow:**
    1.  Triggered after transcription is complete.
    2.  Computes objective metrics.
    3.  Stores metrics in Firestore (`/calls/{callId}/metrics`).
    4.  Updates call status to 'Metrics'.
*   **`score-rubric` flow:**
    1.  Triggered after metrics are computed.
    2.  Uses Gemini 2.5 Pro to score the call against the rubric.
    3.  Stores the score in Firestore (`/calls/{callId}/score`).
    4.  Updates call status to 'Scored'.
*   **`export-to-sheets` flow:**
    1.  Triggered manually from the UI.
    2.  Generates a Google Sheet with summary and detailed tabs.

## 7. Firebase Integration

*   **Firebase App Hosting:** Deploys and hosts the Next.js application.
*   **Firebase Authentication:** Manages user authentication.
*   **Firestore:** NoSQL database for all application data.
*   **Cloud Storage:** Stores uploaded MP3 files.
*   **Cloud Functions:** Hosts the Genkit flows for background processing.

## 8. Security

*   **Firestore Rules:**
    *   Admins can read/write all data.
    *   QAs can read/write all call data but not user roles.
    *   Agents can only read their own user data and their assigned call data.
*   **Environment Variables:** All API keys and secrets (Firebase, Assembly AI, Google AI) will be stored in `.env.local`.

## 9. Testable Preview

A testable preview will be provided through Firebase App Hosting's preview channels. This will allow for testing of all features in a production-like environment before deploying to production.

This blueprint provides a comprehensive overview of the Call Quality Compass application. The next step is to begin implementing the features outlined above, starting with the authentication and basic UI structure.
