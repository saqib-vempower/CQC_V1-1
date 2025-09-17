# AI-powered Call Auditing Tool

An AI-powered call auditing tool designed to empower agents by providing detailed insights and scores for their calls. This application leverages cutting-edge AI technologies to automate the call review process, providing objective, data-driven feedback for coaching and quality assurance.

---

## Features

*   **Secure User Authentication**: Protects access to the auditing tool.
*   **Call Recording Uploads**: Easily upload audio files for auditing.
*   **Metadata Management**: Associate calls with relevant information such as university, domain, call type, and date.
*   **AI-Powered Processing**: Automatic transcription and analysis of calls.
*   **Detailed Call Scoring**: Provides scores across various criteria (c1-c10).
*   **Intuitive User Interface**: Designed for agents, QA, and administrators to manage and review audits.

## Tech Stack

*   **Backend**: Firebase (Cloud Functions, Firestore, Authentication, Storage)
*   **AI & Machine Learning**:
    *   **Google Gemini**: For advanced AI-driven call analysis and scoring.
    *   **AssemblyAI**: For accurate transcription of call recordings.
*   **Frontend**: Next.js & React

---

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation and Setup](#installation-and-setup)
- [Project Structure](#project-structure)
- [Comprehensive Documentation](#comprehensive-documentation)

---

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed and configured:

*   **Node.js** and **npm**
*   **Firebase CLI**: Authenticated with your Google account (`firebase login`).
*   A **Firebase project** with the following services enabled:
    *   Firestore Database
    *   Firebase Storage
    *   Firebase Authentication (with Email/Password provider enabled)
*   **API Keys** for:
    *   Google Gemini
    *   AssemblyAI

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd _firebase/functions
    npm install
    cd ../..
    ```

4.  **Configure API Keys:**
    *   Set your backend API keys securely using the Firebase CLI. Replace the placeholders with your actual keys.
        ```bash
        firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"
        firebase functions:config:set assemblyai.api_key="YOUR_ASSEMBLYAI_API_KEY_HERE"
        ```

5.  **Configure Frontend Environment:**
    *   Create a `.env.local` file in the root directory and add your Firebase project's client-side configuration keys. You can get these from your Firebase project settings.
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=your_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        ```

6.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## Project Structure

*   `_firebase/functions`: Contains all the backend Firebase Cloud Functions.
*   `src/`: Contains the frontend Next.js application.
    *   `src/app`: The main application pages and layouts.
    *   `src/components`: Reusable React components.
    *   `src/lib`: Firebase client initialization and utility functions.
*   `documents/`: Contains all project documentation.

---

## Comprehensive Documentation

All detailed documentation has been organized into the `documents` folder. Here is a guide to what you can find there:

| File Name                                | Description                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [**INSTRUCTIONS.md**](documents/INSTRUCTIONS.md)                     | General user guide on how to use the application.                                                       |
| [**Understanding the Audit Dashboard.md**](documents/Understanding%20the%20Audit%20Dashboard.md) | A detailed guide for agents and QA on how to interpret scores and feedback.                             |
| [**How to change parameters.md**](documents/How%20to%20change%20parameters.md)          | **For Admins:** How to update scoring rules and weights using the Admin UI.                               |
| [**Data Management.md**](documents/Data%20Management.md)                       | **For Admins:** How to manually delete audit data and user accounts.                                    |
| [**How to manually add users.md**](documents/How%20to%20manually%20add%20users.md)         | **For Admins:** Step-by-step instructions for creating new users.                                        |
| [**Troubleshooting Guide.md**](documents/Troubleshooting%20Guide.md)             | Solutions to common problems for all users.                                                             |
| [**Developer Instructions.md**](documents/Developer%20Instructions.md)           | **For Developers:** A detailed breakdown of each backend function and the frontend architecture.      |
| [**Data Model Guide.md**](documents/Data%20Model%20Guide.md)                     | **For Developers:** An explanation of the Firestore database schema.                                      |
| [**How to change API keys in this project.md**](documents/How%20to%20change%20API%20keys%20in%20this%20project.md) | **For Developers/Admins:** How to update API keys and webhooks.                                         |
| [**Backup and Restore Procedures.md**](documents/Backup%20and%20Restore%20Procedures.md)   | **For Admins:** Critical instructions for backing up and restoring application data.                  |
| [**PREINSTALL.md**](documents/PREINSTALL.md)                           | Pre-installation steps and requirements.                                                                |
| [**POSTINSTALL.md**](documents/POSTINSTALL.md)                          | Post-installation configuration steps.                                                                  |
| [**CHANGELOG.md**](documents/CHANGELOG.md)                            | A log of all version changes and updates.                                                               |