# Instructions for Use

This document provides instructions for using the AI-powered Call Auditing Tool.

## Table of Contents

1.  [Overview](#overview)
2.  [Accessing the Application](#accessing-the-application)
3.  [Uploading a Call for Audit](#uploading-a-call-for-audit)
    *   [Required Metadata](#required-metadata)
4.  [Reviewing Audit Results](#reviewing-audit-results)
5.  [Administrator Functions](#administrator-functions)
    *   [User Management](#user-management)
    *   [Configuration](#configuration)

---

## 1. Overview

The AI-powered Call Auditing Tool is designed to automate the process of reviewing and scoring calls. It utilizes AI to transcribe calls, analyze their content, and provide a score based on predefined criteria. This helps agents understand their performance and areas for improvement, while administrators can oversee agent activity and system performance.

## 2. Accessing the Application

1.  **Login**: Navigate to the application's URL.
2.  You will be prompted to log in using your credentials. If you do not have an account, please contact your administrator.

## 3. Uploading a Call for Audit

To audit a new call:

1.  From the dashboard, click on the "New Audit" button.
2.  You will be presented with an upload form.
3.  **Upload Audio File**: Click on the "Choose File" button and select the audio file (e.g., MP3, WAV) of the call you wish to audit.
4.  **Enter Metadata**: Fill in the required metadata fields as described below.
5.  Click "Submit" to start the auditing process. The call will be sent for transcription and AI analysis.

### Required Metadata

*   **University**: The university associated with the call.
*   **Domain**: The domain relevant to the call.
*   **Call Type**: The type of call (e.g., inbound, outbound).
*   **Date**: The date the call took place.
*   **Agent Name**: The name of the agent who handled the call.

## 4. Reviewing Audit Results

Once a call has been processed:

1.  Navigate to the "Audits Dashboard" from the main menu.
2.  You will see a list of all audited calls. Each entry will display key information and the overall score.
3.  Click on a specific audit entry to view detailed results. This includes:
    *   The transcribed text of the call.
    *   Individual scores for each criterion (c1-c10).
    *   AI-generated insights and feedback.

## 5. Administrator Functions

Administrators have additional privileges to manage users and configure application settings.

### User Management

1.  From the dashboard, navigate to the "Admin" section.
2.  Here, you can:
    *   **Add New Users**: Create new agent or administrator accounts.
    *   **Edit User Roles**: Modify user permissions.
    *   **Deactivate Users**: Remove access for former users.

### Configuration

1.  In the "Admin" section, go to "Settings".
2.  Administrators can:
    *   **Update Scoring Criteria**: Adjust the weights or definitions of the c1-c10 scoring criteria.
    *   **Manage AI Models**: Select or configure different AI models for transcription and analysis (if multiple options are available).
    *   **System Settings**: Configure other application-wide settings.
