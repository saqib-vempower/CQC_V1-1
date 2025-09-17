# Data Management

This guide explains how to remove call audit data from your Firestore database and the associated audio files from Firebase Storage. This process needs to be done manually through the Firebase Console.

---

## What Happens When You Delete Data?

*   **Firestore Database**: This is where all the text information about your calls is stored, including audit scores, metadata (university, agent name, etc.), and transcription text. Deleting an entry here removes this record.
*   **Firebase Storage**: This is where the actual audio files of the calls are stored. Deleting a file here removes the sound recording.

**Important Note**: Deleting a record from Firestore (the database) does **NOT** automatically delete the corresponding audio file from Firebase Storage, and vice-versa. You will typically need to delete both separately to completely remove a call audit.

---

## Part 1: Deleting Data from Firestore (Call Audits)

This part shows you how to remove the text-based records of your call audits from the database.

### Step 1: Go to the Firebase Console

1.  Open your web browser and navigate to the Firebase Console: `https://console.firebase.google.com/`
2.  Log in with your Google account.

### Step 2: Select Your Project

1.  From the Firebase console homepage, select the project where the AI-powered Call Auditing Tool is deployed.

### Step 3: Navigate to Firestore Database

1.  In the left-hand menu, find and click on "Firestore Database" (usually under the "Build" section).
2.  You will see your collections (folders of data) on the left side.

### Step 4: Find and Delete the Audit Record

1.  On the left, click on the `audits` collection. This collection contains all your call audit records.
2.  You will see a list of documents (individual audit records). Each document has a unique ID.
3.  **Identify the record you want to delete**:
    *   You might recognize it by the `agentName`, `university`, `originalFilename`, or other fields displayed.
    *   If you know the `auditId` (which is part of the filename in storage), you can look for the document with that ID.
4.  Once you've found the document you want to delete:
    *   Click on the three vertical dots (⋮) next to the document ID.
    *   Select "Delete document".
    *   A confirmation dialog will appear. Read it carefully and confirm the deletion.
    *   The document will be removed from your Firestore database.

---

## Part 2: Deleting Stored Audio Files from Firebase Storage

This part shows you how to remove the actual audio files of your call recordings.

### Step 1: Go to the Firebase Console (if not already there)

1.  If you closed it, open your web browser and go to the Firebase Console: `https://console.firebase.google.com/`
2.  Log in with your Google account and select your project.

### Step 2: Navigate to Storage

1.  In the left-hand menu, find and click on "Storage" (usually under the "Build" section).
2.  You will see your storage buckets and folders.

### Step 3: Go to the 'audits' Folder

1.  In the Storage browser, click on the `audits` folder. This folder contains all the uploaded call audio files.

### Step 4: Find and Delete the Audio File

1.  You will see a list of audio files. The filenames usually include the `auditId`, `agentName`, and `applicantId` (e.g., `[auditId]-[agentName]_[applicantId]_[timestamp].mp3`).
2.  **Identify the audio file you want to delete**:
    *   Match the filename with the call you want to remove.
    *   It's often helpful to have the `auditId` or the `originalFilename` from the Firestore record you just deleted (or plan to delete) to find the correct audio file.
3.  Once you've found the file:
    *   Click on the three vertical dots (⋮) next to the filename.
    *   Select "Delete file".
    *   A confirmation dialog will appear. Read it carefully and confirm the deletion.
    *   The audio file will be removed from your Firebase Storage.

---

## Deleting User Accounts and Roles

If you need to completely remove a user from the system (not just their call audits), you need to do two things:

### Part 1: Delete User from Firebase Authentication

1.  Go to the Firebase Console > **Authentication**.
2.  In the "Users" tab, find the user's email address.
3.  Click the three vertical dots (⋮) next to the user.
4.  Select "Delete account" and confirm.

### Part 2: Delete User Role from Firestore

1.  Go to the Firebase Console > **Firestore Database**.
2.  Click on the `users` collection.
3.  Find the document whose ID matches the **User UID** of the user you just deleted from Authentication.
4.  Click the three vertical dots (⋮) next to that document.
5.  Select "Delete document" and confirm.

By following these steps, you can manually manage and delete data and files within your Firebase project. Remember to always double-check before deleting, as these actions are usually irreversible.

---

## Mass Deletion of Data (e.g., by Month)

Deleting a large amount of data (like all call audits for an entire month) can be a complex and irreversible process. The Firebase Console is designed for deleting individual items or small batches, not for mass deletion of thousands of records efficiently. For large-scale deletions, it is highly recommended to seek assistance from an IT professional or administrator.

However, you can *identify* data for a specific period within the Firebase Console to help plan a deletion or manually delete smaller batches.

### Step 1: Identify Records by Date in Firestore

1.  Go to the Firebase Console > **Firestore Database**.
2.  Click on the `audits` collection.
3.  You will need to use the "Filter" function to find documents within a specific date range.
    *   Click on the "Add filter" button.
    *   Select the field that stores the date (e.g., `dateCreated` or `callDate`). The exact field name depends on how dates are stored in your audit documents. It should be a `timestamp` or `string` field that represents the date of the call or audit creation.
    *   Choose an operator like `is greater than or equal to (>=)`.
    *   Enter the start date of the month you want to delete (e.g., `YYYY-MM-01`). For `timestamp` fields, you might need to select a date and time from a calendar picker.
    *   Add another filter for the same date field, choosing `is less than (<)`.
    *   Enter the start date of the *next* month (e.g., `YYYY-MM-01` of the following month) to ensure you capture all records within your target month.
    *   **Example for January 2023**: `dateCreated >= 2023-01-01` AND `dateCreated < 2023-02-01`.
4.  The console will then display only the audit records that fall within your specified month.

### Step 2: Limitations of Mass Deletion in the Console

*   **Manual Deletion**: Even after filtering, you would still need to select and delete each document individually, or in small batches if the console allows it. This is extremely time-consuming and prone to error for hundreds or thousands of records.
*   **Associated Storage Files**: For every Firestore document you delete, there is likely an associated audio file in Firebase Storage. The console does *not* automatically delete these linked files. You would have to manually find and delete each corresponding audio file in Firebase Storage as well (refer to `Part 2: Deleting Stored Audio Files from Firebase Storage` above). This makes manual mass deletion virtually unfeasible.

### Recommendation for Large-Scale Deletions

For genuinely mass deletions (e.g., deleting all data for a month, which could involve hundreds or thousands of records and files):

*   **Contact an IT Professional / Administrator**: This type of operation is best handled by someone with technical expertise. They can use specialized tools like:
    *   **Firebase CLI**: Commands can be scripted to delete collections or documents based on queries.
    *   **Firebase Admin SDK**: A custom script can be written to query and delete data programmatically, ensuring both Firestore documents and linked Storage files are removed in a coordinated manner.
    *   **Firebase Extensions**: Some pre-built extensions might offer data lifecycle management features.

Attempting to manually delete a large volume of data can lead to incomplete deletions (orphaned audio files or database records), errors, and significant time investment. Always prioritize seeking expert assistance for such critical operations.
