# How to Change API Keys and Webhooks in This Project

This document provides detailed, step-by-step instructions on how to update API keys and webhooks used within the AI-powered Call Auditing Tool. These instructions are designed to be followed by anyone, even without prior IT knowledge.

---

## What are API Keys?

API (Application Programming Interface) keys are like special passwords that allow our application to talk to other services (like Google Gemini for AI analysis, or AssemblyAI for transcribing calls). They tell the service, "Hey, I'm an authorized application, and I'm allowed to use your features."

There are two main places where API keys are used in this project:

1.  **Backend (Firebase Functions)**: These are sensitive keys used by our server-side code (Firebase Functions) to interact with services like Google Gemini and AssemblyAI. It's very important that these keys are kept secret.
2.  **Frontend (Next.js Application)**: Occasionally, less sensitive API keys might be used by the visible part of our application (the website). These are usually for public services that don't need to be kept as secret.

---

## How to Change Backend API Keys (Google Gemini, AssemblyAI)

Changing backend API keys requires using a special tool called the "Firebase Command Line Interface" (Firebase CLI) in a terminal window.

### Step 1: Open a Terminal (Command Prompt / PowerShell)

1.  **On Windows**:
    *   Click the "Start" button.
    *   Type `cmd` (for Command Prompt) or `powershell` (for PowerShell) and press Enter. A black or blue window will appear.
2.  **On Mac/Linux**:
    *   Open "Applications" -> "Utilities" -> "Terminal". A window with a command line will appear.

### Step 2: Navigate to the Project Folder

In the terminal window, you need to go to the main folder of this project. If you're unsure where it is, ask the person who set up the project.

*   Type `cd` (which means "change directory") followed by a space, then the path to your project folder.
*   **Example (you'll need to replace `/path/to/your/project` with the actual path):**
    ```bash
    cd /path/to/your/project
    ```
*   Press Enter. If successful, your terminal prompt might change to show you're in that folder.

### Step 3: Set the New API Key

Now you will use a special command to tell Firebase about the new API key.

*   **For Google Gemini API Key:**
    *   Type the following command into your terminal, **replacing `YOUR_GEMINI_API_KEY_HERE` with the actual new API key for Google Gemini**:
        ```bash
        firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"
        ```
    *   Press Enter.
    *   You should see a message confirming that the configuration was updated.

*   **For AssemblyAI API Key:**
    *   Type the following command into your terminal, **replacing `YOUR_ASSEMBLYAI_API_KEY_HERE` with the actual new API key for AssemblyAI**:
        ```bash
        firebase functions:config:set assemblyai.api_key="YOUR_ASSEMBLYAI_API_KEY_HERE"
        ```
    *   Press Enter.
    *   You should see a message confirming that the configuration was updated.

### Step 4: Deploy the Changes (Very Important!)

Even though you've told Firebase about the new keys, our "Cloud Functions" (the backend code) need to be updated to use them.

*   Type the following command into your terminal:
    ```bash
    firebase deploy --only functions
    ```
*   Press Enter.
*   This process might take a few minutes. Wait until you see a message indicating that the functions have been deployed successfully.

---

## How to Change Frontend API Keys (If Applicable)

If your project uses any non-sensitive API keys directly in the website code (frontend), they are usually stored in special files or configured in the hosting provider.

### For Development (on your computer)

1.  **Locate `.env.local` file**: In your project's main folder, look for a file named `.env.local`. If it doesn't exist, it might be `.env`. Open this file using a simple text editor (like Notepad on Windows, TextEdit on Mac, or any code editor if you have one).
2.  **Find the API key line**: Inside this file, you'll see lines that look like `REACT_APP_SOME_API_KEY=your_old_key_here`.
3.  **Replace the key**: Change `your_old_key_here` to your `YOUR_NEW_API_KEY_HERE`.
    *   **Example:**
        ```
        NEXT_PUBLIC_MAPS_API_KEY=YOUR_NEW_MAPS_API_KEY_HERE
        ```
4.  **Save the file**.
5.  **Restart the development server**: If you are running the application locally (e.g., with `npm run dev`), you'll need to stop it (usually by pressing `Ctrl+C` in the terminal) and start it again for the changes to take effect.

### For Production (live website)

When the application is live on the internet, these keys are set as "environment variables" in your hosting provider (e.g., Vercel, Netlify, or Firebase Hosting settings).

1.  **Log in to your hosting provider's dashboard**: Go to the website where your application is hosted and log in.
2.  **Navigate to Project Settings / Environment Variables**: Look for a section related to your project's settings, typically under "Environment Variables", "Build & Deploy", or "Secrets".
3.  **Find and Update the Variable**: Locate the environment variable corresponding to the API key you want to change (e.g., `NEXT_PUBLIC_MAPS_API_KEY`).
4.  **Enter the New Value**: Update the value of this variable with your new API key.
5.  **Save and Redeploy**: Save your changes. You might need to trigger a new deployment for your website for the new environment variables to be picked up. The exact steps vary by hosting provider.

**Important Security Note**: **NEVER** put sensitive API keys (like those for Google Gemini or AssemblyAI) directly into frontend code or `.env.local` if the `NEXT_PUBLIC_` prefix is used, as they can be seen by anyone visiting your website. Frontend keys should only be for public-facing services.

---

## How to Change Webhooks

A webhook is a way for one application to send real-time information to another application. In our project, a service like AssemblyAI might use a webhook to tell our system when a call transcription is ready. The webhook URL is the address of our application that AssemblyAI calls.

In this project, the webhook is likely the public address of one of our Firebase Cloud Functions (e.g., `onAiTranscripting`). When you deploy a Firebase Function that listens for HTTP requests, Firebase automatically gives it a unique URL.

Changing a webhook typically means:

1.  Finding the new public URL of our Firebase Function (if it has changed, which is rare unless you redeploy with a new name or region).
2.  Updating this URL in the settings of the *external service* (e.g., AssemblyAI) that is sending the webhook.

### Step 1: Find the Webhook URL (Our Firebase Function's Address)

1.  **Go to the Firebase Console**: Open your web browser and go to `https://console.firebase.google.com/`. Log in with your Google account.
2.  **Select Your Project**: From the Firebase console homepage, select your project.
3.  **Navigate to Functions**: In the left-hand menu, click on "Functions".
4.  **Find the Relevant Function**: Look for the function that is designed to receive webhooks. This is typically `onAiTranscripting` or a similar function in the `audit-pipeline/receiver` module.
5.  **Copy the Trigger URL**:
    *   Click on the function name (e.g., `onAiTranscripting`).
    *   Go to the "Trigger" tab (or "Triggers" section).
    *   You will see a "URL" or "HTTPS Trigger URL" listed. This is the webhook URL that external services should send data to.
    *   Copy this entire URL.

### Step 2: Update the Webhook in the External Service (e.g., AssemblyAI)

Now that you have the correct URL from our Firebase Function, you need to tell the external service (like AssemblyAI) to use this new address.

1.  **Log in to the External Service's Dashboard**: Go to the website of the service that is sending the webhook (e.g., AssemblyAI's dashboard).
2.  **Navigate to API Settings / Webhooks / Callbacks**: Look for a section where you can configure webhooks, callback URLs, or API settings. This location varies by service.
3.  **Paste the New Webhook URL**: Find the field where the webhook URL is currently set and replace the old URL with the new URL you copied from the Firebase Console.
4.  **Save Changes**: Save your changes in the external service's dashboard.

From now on, the external service will send its real-time updates to the new address of our Firebase Function.