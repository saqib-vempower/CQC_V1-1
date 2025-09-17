# Developer Instructions

This document provides a detailed overview of the core Firebase Functions used in the AI-powered Call Auditing Tool. Each function plays a crucial role in the application's lifecycle, from user authentication to the comprehensive AI-driven call auditing pipeline.

## Table of Contents

1.  [onCallUpload](#oncallupload)
2.  [onAiTranscripting](#onaitranscripting)
3.  [onAiAuditing](#onaiaauditing)
4.  [onScored](#onscored)
5.  [onLogin](#onlogin)
6.  [scoreCall](#scorecall)
7.  [reAuditCall](#reauditcall)
8.  [Security System](#security-system)
9.  [Frontend](#frontend)

---

## 1. `onCallUpload`
*   **Module**: `audit-pipeline/initiator`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: This function is the entry point for initiating a new call audit. It is triggered when a user uploads a new call recording and associated metadata. Its primary responsibility is to kick off the auditing pipeline by performing initial checks and queuing the call for transcription.

## 2. `onAiTranscripting`
*   **Module**: `audit-pipeline/receiver`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: This function is responsible for handling the reception of the call recording and facilitating its transcription. It interacts with external transcription services (e.g., AssemblyAI) to convert the audio into text, which is a prerequisite for AI analysis.

## 3. `onAiAuditing`
*   **Module**: `audit-pipeline/processor`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: Following successful transcription, this function takes the transcribed text and subjects it to AI-powered analysis. It leverages advanced AI models (e.g., Google Gemini) to extract insights, identify key events, sentiment, and compliance-related aspects from the call. This function prepares the data for scoring.

## 4. `onScored`
*   **Module**: `audit-pipeline/calculator`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: After the AI auditing process is complete, this function is responsible for calculating the final audit scores. It applies predefined scoring criteria (c1-c10, as seen in `common.ts`) to the AI-generated insights to produce a comprehensive score for the call. It also persists these scores to the database.

## 5. `onLogin`
*   **Module**: `user-management`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: This function handles user authentication and related processes. It is triggered upon a user attempting to log into the application. It verifies user credentials and manages session-related activities, ensuring secure access to the auditing tool.

## 6. `scoreCall`
*   **Module**: `ai/scoreCall`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: This is a dedicated AI function that encapsulates the core logic for applying the AI model to score a call. It is likely called by `onAiAuditing` or other functions that require direct AI scoring capabilities. It takes processed call data and returns a structured score based on the configured AI model and criteria.

## 7. `reAuditCall`
*   **Module**: `audit-pipeline/reAudit`
*   **Location**: `us-central1`
*   **Generation**: `2nd Gen`
*   **Purpose**: This function provides the capability to re-process an already audited call. This is useful in scenarios where audit criteria have been updated, or a re-evaluation of a past call is required. It triggers a new run through the auditing pipeline for a specified call.

## 8. Security System

The AI-powered Call Auditing Tool prioritizes robust security to protect sensitive call data and user information. Our security measures are built upon Firebase's comprehensive security features and augmented with an incremental second-factor authentication system.

*   **Secure User Authentication**:
    *   Leverages Firebase Authentication for managing user identities.
    *   Supports standard email/password authentication.
    *   Integrates with `onLogin` function to verify credentials and manage user sessions securely.

*   **Role-Based Access Control (RBAC)**:
    *   Access to different features and data within the application is controlled based on user roles (e.g., Agent, Administrator).
    *   Firestore Security Rules are meticulously configured to enforce these access controls, ensuring users can only interact with data and functions they are authorized to.

*   **Data Encryption**:
    *   All data stored in Firebase services (Firestore, Storage) benefits from Google's robust encryption-at-rest and in-transit capabilities.
    *   Call recordings and their transcriptions are stored securely, minimizing the risk of unauthorized access.

*   **Incremental Second-Factor Authentication (2FA)**:
    *   For features or actions that require an elevated level of security (e.g., administrator configurations, sensitive data access), the application prompts users for a second factor of authentication.
    *   This incremental approach enhances security by adding an extra layer of verification only when necessary, balancing security with user experience.
    *   The implementation allows for flexible integration of various 2FA methods.

*   **Cloud Function Security**:
    *   Firebase Cloud Functions are secured using Identity and Access Management (IAM) policies, ensuring that only authorized services and users can invoke them.
    *   Network configurations and runtime environments for functions are hardened to prevent common vulnerabilities.

## 9. Frontend

The frontend of the AI-powered Call Auditing Tool is built using Next.js and React, providing a dynamic and responsive user interface. Navigation and access control are key aspects of the frontend architecture. The `withAuthorization` Higher-Order Component (HOC) (`src/components/withAuthorization.tsx`) is extensively used to enforce role-based access to specific pages.

### Pages Overview:

*   **`/` (Home/Landing Page)**:
    *   This is the initial entry point for the application. It typically serves as a landing page or immediately redirects to the login page if the user is not authenticated.

*   **`/login` (Login Page)**:
    *   Handles user authentication. Users enter their credentials to gain access to the application. Upon successful login, users are redirected to their respective role-based dashboards or a default dashboard.

*   **`/admin` (Admin Portal)**:
    *   **Purpose**: Provides administrative users with a central hub to manage the application. This page is protected by the `withAuthorization` HOC, requiring the `Admin` role for access.
    *   **Navigation**: From this page, administrators can navigate to:
        *   **Dashboard (`/dashboard`)**: To view overall call quality metrics and individual audits.
        *   **Tool (`/tool`)**: For specific administrative tasks or advanced auditing functionalities.
        *   **Macro Dashboard (`/macro-dashboard`)**: For a high-level overview and aggregated data insights.

*   **`/qa` (QA Portal)**:
    *   **Purpose**: Designed for Quality Assurance team members to access and manage call audits. Similar to the Admin portal, this page is secured by the `withAuthorization` HOC, requiring the `QA` role.
    *   **Navigation**: From this page, QA team members can navigate to:
        *   **Dashboard (`/dashboard`)**: To review call quality and audit results.
        *   **Tool (`/tool`)**: For performing QA-specific tasks, such as initiating new audits or re-auditing calls.
        *   **Macro Dashboard (`/macro-dashboard`)**: For aggregated views relevant to QA processes.

*   **`/dashboard` (Call Quality Dashboard)**:
    *   **Purpose**: This is a central dashboard for viewing audit results and call quality metrics. It integrates the `AuditsDashboard` component (`src/components/audits/AuditsDashboard.tsx`) to display a list of audited calls, their scores, and other relevant data.
    *   **Navigation**: Features a back button (`showBackButton={true}`) to easily return to the previous page (e.g., `/admin` or `/qa`).

*   **`/tool` (Tool Page)**:
    *   **Purpose**: This page is intended for specific operational tasks within the application. It might house functionalities like manual call upload, configuration of audit parameters, or more granular control over the auditing process.
    *   **Connection**: Accessible from both the `/admin` and `/qa` portals, suggesting its utility across different user roles for performing actions.

*   **`/macro-dashboard` (Macro Dashboard Page)**:
    *   **Purpose**: Provides a higher-level, aggregated view of call audit data. This dashboard is likely designed for managers or those needing a birds-eye view of trends, overall performance, and strategic insights rather than individual call details.
    *   **Connection**: Accessible from both the `/admin` and `/qa` portals, indicating its relevance for both administrative oversight and quality assurance strategy.

**Frontend Components**:

The application leverages a modular component architecture. Key UI components are found in `src/components/ui`, such as `PageLayout`, `Button`, `Card`, `Dialog`, etc. Specific application-level components like `AuditsDashboard` (`src/components/audits/AuditsDashboard.tsx`) are used to render core functionalities within pages.