# POSTINSTALL

## AI-powered Call Auditing Tool Extension - Post-Installation Steps

Congratulations on installing the AI-powered Call Auditing Tool extension! Follow these steps to complete the setup and begin using the application.

### 1. Configure Firebase Security Rules

To ensure proper functioning and data security, you must configure your Firebase Firestore and Storage security rules. These rules control who can read and write data in your database and storage buckets, based on user roles.

*   **Firestore Security Rules**:
    *   Navigate to the Firebase Console -> Firestore Database -> Rules.
    *   Implement rules to define access control for different collections (e.g., `audits`, `users`).
    *   Ensure that only authenticated users can access their own data and that administrators have appropriate elevated privileges.
    *   Example (simplified): 
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            match /audits/{auditId} {
              allow read: if request.auth != null;
              allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent';
              allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
            }
          }
        }
        ```

*   **Firebase Storage Security Rules**:
    *   Navigate to the Firebase Console -> Storage -> Rules.
    *   Define rules to control access to your call recording files. Only authenticated users should be able to upload, and appropriate roles should have read access.
    *   Example (simplified): 
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /call_recordings/{fileName} {
              allow write: if request.auth != null;
              allow read: if request.auth != null;
            }
          }
        }
        ```

### 2. Set Up Environment Variables (if applicable)

If your Next.js frontend or Firebase Functions require additional environment variables (e.g., for different API keys, third-party service configurations), ensure these are set up correctly.

*   For Next.js, use `.env.local` for development and configure deployment-specific environment variables for production.
*   For Firebase Functions, use `firebase functions:config:set` to set runtime environment variables.

### 3. Deploy Frontend Application

Deploy your Next.js application to a hosting service (e.g., Firebase Hosting, Vercel, Netlify). Ensure that your application is correctly configured to connect to your Firebase project.

### 4. Verify Cloud Function Deployments

Confirm that all necessary Firebase Cloud Functions (as detailed in `Developer Instructions.md`) are deployed and running correctly. You can check their status in the Firebase Console -> Functions -> Dashboard.

### 5. Create Initial User Accounts and Roles

Use Firebase Authentication to create initial user accounts. For users who will have administrative or QA privileges, ensure their roles are correctly assigned in your Firestore database (e.g., in a `users` collection).

### 6. Test the Application

Perform end-to-end testing to ensure all features are working as expected:

*   Login with different user roles.
*   Upload a call recording and verify it processes correctly.
*   Review audit results in the dashboard.
*   Test administrative functions (if applicable).

By following these post-installation steps, you will have a fully functional AI-powered Call Auditing Tool ready for use.
