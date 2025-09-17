# PREINSTALL

## AI-powered Call Auditing Tool Extension

This extension provides an AI-powered call auditing tool designed to assist agents by offering detailed insights and scores for their calls. It automates the call review process using advanced AI technologies.

## Functionality

*   **Secure User Authentication**: Manages user access and ensures data security.
*   **Call Recording Uploads**: Facilitates the upload of audio files for auditing.
*   **Metadata Management**: Allows for associating calls with relevant details (university, domain, call type, date).
*   **AI-Powered Processing**: Automatically transcribes and analyzes call recordings.
*   **Detailed Call Scoring**: Generates scores based on predefined criteria (c1-c10).
*   **Intuitive User Interface**: Provides dashboards for agents and administrators to manage and review audits.

## Prerequisites

Before installing this extension, ensure you have:

1.  **Firebase Project**: An active Firebase project where you intend to install this extension.
2.  **Firebase Authentication**: Enabled Firebase Authentication for your project to manage user logins.
3.  **Firestore Database**: A Firestore database configured to store call audit data, user information, and other application-related data.
4.  **Firebase Storage**: Enabled Firebase Storage for storing call recording audio files.
5.  **External API Keys**: Access to API keys for external services:
    *   **Google Gemini**: For AI-driven call analysis and scoring.
    *   **AssemblyAI**: For accurate transcription of call recordings.

    **Configuration and Storage of API Keys:**
    *   **Backend (Firebase Functions)**: For sensitive API keys like Google Gemini and AssemblyAI, these should be stored securely as Firebase Functions environment configuration variables. This prevents them from being exposed in your codebase and allows for easy management.
        To set an API key, use the Firebase CLI command:
        ```bash
        firebase functions:config:set service.api_key="YOUR_API_KEY"
        ```
        Replace `service` with the name of the service (e.g., `gemini`, `assemblyai`) and `api_key` with the actual key. You can then access these values within your Cloud Functions.

    *   **Frontend (Next.js)**: If any *non-sensitive* API keys are required on the client-side (e.g., for analytics, or public-facing services), they can be stored in `.env.local` during development and configured as environment variables in your hosting provider for production. **Never expose sensitive API keys directly in client-side code.**

    These keys will need to be configured during the installation and deployment process.

## Billing Implications

This extension uses the following Firebase services, which may incur costs:

*   **Cloud Firestore**: For storing audit results, user data, and metadata.
*   **Cloud Storage**: For storing call recording audio files.
*   **Cloud Functions**: For running the backend logic, including transcription, AI analysis, and scoring.
*   **Firebase Authentication**: For user management.

Additionally, usage of external APIs like Google Gemini and AssemblyAI will incur costs based on their respective pricing models. Please review their pricing documentation for more details.
