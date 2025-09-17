# How to Manually Add Users to the Project

This guide provides step-by-step instructions on how to manually create a new user account for the AI-powered Call Auditing Tool using the Firebase Console. This process involves two main parts: creating the user in Firebase Authentication and then assigning a role to that user in Firestore.

---

## Part 1: Create a User in Firebase Authentication

Firebase Authentication manages user accounts, allowing them to log in to the application.

### Step 1: Go to the Firebase Console

1.  Open your web browser and navigate to the Firebase Console: `https://console.firebase.google.com/`
2.  Log in with your Google account.

### Step 2: Select Your Project

1.  From the Firebase console homepage, select the project where the AI-powered Call Auditing Tool is deployed.

### Step 3: Navigate to Authentication

1.  In the left-hand menu, find and click on "Authentication" (usually under the "Build" section).
2.  You will see a dashboard for user management.

### Step 4: Add a New User

1.  On the Authentication page, click the "Add user" button. It's usually located near the top of the user list.
2.  A dialog box will appear asking for user details:
    *   **Email**: Enter the email address for the new user.
    *   **Password**: Set a temporary password for the new user. Advise the user to change this after their first login.
3.  Click the "Add user" button in the dialog to create the account.

Once added, you will see the new user listed in the "Users" tab of the Authentication page.

---

## Part 2: Assign a Role to the User in Firestore

Our application uses roles (like `admin` or `agent`) to control what users can see and do. These roles are stored in Firestore, and a special Firebase Function (`onLogin`) uses this information to set up the user's permissions when they log in.

### Step 1: Get the User's UID (User ID)

1.  After creating the user in Firebase Authentication (Part 1), stay on the Authentication page.
2.  Find the newly created user in the list.
3.  Copy their "User UID" (User ID). This is a long string of letters and numbers (e.g., `abcdefg12345...`). You will need this for the next step.

### Step 2: Navigate to Firestore Database

1.  In the left-hand menu of the Firebase Console, click on "Firestore Database" (also under the "Build" section).

### Step 3: Create a New User Document

1.  On the Firestore Data page, you should see a list of your collections.
2.  Look for a collection named `users`. If it doesn't exist, you will need to create it:
    *   Click "Start collection" if it's your first collection, or "Add collection" if you have others.
    *   Enter `users` as the Collection ID.
3.  **Add a new document to the `users` collection**:
    *   Click "Add document" within the `users` collection.
    *   For the "Document ID", **paste the User UID** you copied in Step 1 of this Part. This is crucial for linking the user's role to their Authentication account.
4.  **Add Fields to the Document**:
    *   Click "Add field".
    *   For "Field name", type `role`.
    *   For "Type", select `string`.
    *   For "Value", type the desired role: 
        *   `admin` (for administrators who can manage settings and all audits)
        *   `agent` (for agents who can upload calls and view their own audits)
        *   `qa` (for QA team members who can review audits)
    *   Click "Add field" again to add another field.
    *   For "Field name", type `email`.
    *   For "Type", select `string`.
    *   For "Value", type the email address of the user you just created in Firebase Authentication.
5.  Click "Save" to create the document.

---

## What Happens Next?

When the new user logs into the application for the first time, our `onLogin` Firebase Function (from `_firebase/functions/src/user-management.ts`) will automatically read the `role` from this Firestore document and assign the corresponding permissions to their account. This ensures they have the correct access level within the application.

By following these steps, you have successfully created a new user and assigned them a role in the AI-powered Call Auditing Tool.