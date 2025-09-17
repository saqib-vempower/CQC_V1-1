# Troubleshooting Guide

This document helps you solve common problems you might encounter while using the AI-powered Call Auditing Tool. If your issue is not listed here, please contact your system administrator for further assistance.

---

## For All Users (Agents, QA, Admins)

### **Problem: I can't log in or I forgot my password.**

*   **Solution:** Currently, the application does not have a self-serve password reset feature. Please contact your administrator. They can create a new temporary password for you through the Firebase Console.

### **Problem: My audio file upload is failing or getting stuck.**

*   **Solution:** There are a few common reasons for upload failures:
    1.  **Check your internet connection.** A weak or unstable connection can interrupt uploads.
    2.  **Check the file format.** Ensure your audio file is in a supported format (e.g., MP3, WAV, FLAC).
    3.  **Check the file size.** Very large files may take a long time to upload or might exceed server limits. Try compressing the file if possible, or ensure your connection is stable for the duration of the upload.

### **Problem: An audit has been "processing" for a very long time.**

*   **Solution:** The auditing process, which includes transcription and AI analysis, can take several minutes, especially for longer calls.
    1.  Please wait at least 10-15 minutes.
    2.  Refresh the dashboard to see if the status has updated.
    3.  If an audit remains in the "processing" state for more than an hour, there may have been an error. Please report the specific call (e.g., the agent name and call date) to your administrator so they can investigate.

---

## For Administrators

### **Problem: The AI score seems wrong, unfair, or doesn't make sense.**

*   **Solution:** While the AI is powerful, its analysis is based on patterns and predefined logic. Here’s how to investigate a questionable score:
    1.  **Review the Transcript and Feedback:** First, read the `transcriptText` and the AI-generated `feedback` in the audit details. The justification for the score is often found there.
    2.  **Check the `observables`:** Look at the `observables` data in the Firestore document for that audit. This provides objective data that influences the score. For example, for **C4 (Managing Holds, Pauses)**, check the `gapsOver4s` value. If that number is high, it justifies a lower score for that criterion.
    3.  **Understand AI Limitations:** The AI scores based on the logic it was given (e.g., the `SIGNPOST_PATTERNS` in `computeObservables.ts`). It may not always capture the full context or nuance of a conversation. Use the scores as a coaching tool, not an absolute judgment.
    4.  **Trigger a Re-Audit:** If you believe there was a temporary system error, you can use the `reAuditCall` function (if an interface is available, or by triggering it on the backend) to re-process the call from scratch.

### **Problem: A new user can't log in or has the wrong permissions.**

*   **Solution:** This is almost always due to a mismatch between the Authentication account and the Firestore user record.
    1.  **Verify the User UID:** Go to the Firebase Console -> **Authentication**. Find the user and copy their **User UID**.
    2.  **Check the Firestore Document:** Go to **Firestore Database** -> `users` collection. Find the document for that user. **The Document ID must exactly match the User UID you copied.**
    3.  **Verify the `role` field:** Ensure the document has a `role` field (as a `string`) with the correct value (e.g., `admin`, `qa`, `agent`). Any typo will cause permission issues.

### **Problem: I deleted an audit record in Firestore, but the audio file is still taking up space.**

*   **Solution:** Deleting a record in the Firestore database does **not** automatically delete the associated audio file in Firebase Storage. You must delete them separately. Please refer to the **"Data Management.md"** guide for instructions on how to delete files from Firebase Storage.