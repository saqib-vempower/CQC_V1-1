# Data Model Guide

This document provides a detailed overview of the Firestore database schema used in the AI-powered Call Auditing Tool. It is intended for developers who need to understand, maintain, or extend the application's data structures.

---

## Core Collections

The application's data is primarily organized into three core collections: `users`, `audits`, and `settings`.

### 1. The `users` Collection

This collection stores information about each user with access to the application.

*   **Document ID**: The user's unique Firebase Authentication UID (`User UID`). This directly links the Firestore user record to their authentication credentials.
*   **Purpose**: To manage user roles and permissions, which are used by Firebase Security Rules and the `onLogin` Cloud Function to control access.

#### Key Fields:
| Field Name | Type   | Description                                           |
|------------|--------|-------------------------------------------------------|
| `email`    | String | The user's email address.                             |
| `role`     | String | The user's role (`admin`, `qa`, `agent`). Controls permissions. |

---

### 2. The `audits` Collection

This is the main collection where all data related to each call audit is stored.

*   **Document ID**: A unique, auto-generated ID created by Firestore upon document creation.
*   **Purpose**: To store the entire lifecycle of a call audit, from the initial metadata to the final scores and AI feedback.

#### Key Fields:
| Field Name         | Type      | Description                                                                  |
|--------------------|-----------|------------------------------------------------------------------------------|
| `agentName`        | String    | The name of the agent who handled the call.                                  |
| `university`       | String    | The university associated with the call.                                     |
| `callDate`         | Timestamp | The date and time the call took place.                                       |
| `dateCreated`      | Timestamp | The timestamp when the audit document was created.                           |
| `originalFilename` | String    | The original filename of the uploaded audio file.                            |
| `storagePath`      | String    | The path to the audio file in Firebase Storage.                              |
| `status`           | String    | The current status of the audit (`processing`, `completed`, `error`).          |
| `transcriptText`   | String    | The full text transcription of the call.                                     |
| `c1Score` - `c10Score` | Number    | The numerical score for each of the 10 scoring criteria.                     |
| `overallScore`     | Number    | The final, weighted score for the entire audit.                              |
| `feedback`         | String    | AI-generated feedback and justification for the scores.                      |
| `observables`      | Map       | A map of objective metrics calculated from the call (e.g., `talkTime`, `gapCount`). |

---

### 3. The `settings` Collection

This collection stores the dynamic configuration for the scoring rubric, allowing administrators to change it without code deployments.

*   **Document ID**: A known, static ID (e.g., `scoringCriteria`). The application code will always reference this specific document to get the settings.
*   **Purpose**: To externalize the scoring logic's parameters so they can be managed by administrators through the Admin UI.

#### Key Fields:
The document contains fields for each criterion, structured as maps.

*   **`c1` - `c10`** (Map): Each criterion is a map containing its configurable properties.
    *   **`definition`** (String): The text description of the criterion (e.g., "Professional Tone & Language").
    *   **`weight`** (Number): The numerical weight used in the overall score calculation.

---

## Programmatic Data Updates

Developers interacting with this data will primarily use the `update()` or `set()` methods from the Firebase SDK.

*   **`update()`**: Use this to modify fields on an existing document without overwriting the entire document.

    *   **Python Example:**
        ```python
        # In a Cloud Function, change the status of an audit
        audit_ref = db.collection("audits").document("someAuditId")
        audit_ref.update({"status": "completed"})
        ```

*   **`set(..., merge: true)`**: Use this to create a new document or overwrite parts of an existing one. The `merge: true` option is crucial as it prevents you from accidentally deleting fields you didn't specify.

    *   **Java Example:**
        ```java
        // Create or update a user's role
        Map<String, Object> userData = new HashMap<>();
        userData.put("role", "admin");

        db.collection("users").document("aUserUid").set(userData, SetOptions.merge());
        ```