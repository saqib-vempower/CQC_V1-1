# How to Change Scoring Rules (Parameters and Weightages)

This guide provides easy-to-follow instructions on how to update the scoring rules, their definitions, and their importance (weightages) for the AI-powered Call Auditing Tool.

---

### What are Scoring Rules and Why Change Them?

Think of scoring rules as the "rubric" the AI uses to grade a call. Each rule looks at a specific aspect of the conversation. These rules have two main parts you can change:

*   **Definition**: The text that describes what the rule is about (e.g., "C1: Professional Tone & Language").
*   **Weightage**: The number that determines how important that rule is to the final score. A higher weight means it has a bigger impact.

You might want to change these to adapt to new business goals, focus on different areas for agent coaching, or fine-tune the accuracy of the scoring system.

---

## The Easy Way: Using the Admin Settings Page (Recommended)

The application is designed so that administrators can easily change these rules at any time without needing any technical help. The changes happen instantly for all new call audits.

#### **Step-by-Step Instructions:**

1.  **Log in as an Administrator:**
    *   Open the application in your web browser.
    *   Log in using an account that has `admin` privileges.

2.  **Go to the Admin Section:**
    *   After logging in, find and click on the "Admin" link in the navigation menu.

3.  **Open "Settings":**
    *   Within the Admin portal, click on the "Settings" link or button.

4.  **Find and Change the Scoring Rules:**
    *   On the Settings page, you will see a list of the scoring criteria (`C1` through `C10`).
    *   For each criterion, there will be input fields where you can edit:
        *   The **Definition** (the text description).
        *   The **Weightage** (the numerical importance).
    *   Carefully update the text or numbers for any rules you want to change.

5.  **Save Your Changes:**
    *   Once you are finished, click the **"Save"** or **"Update Settings"** button. Your changes are now live and will be used for the next call that gets audited.

---

## Understanding What Can Be Changed

It is important to know what you can easily change yourself versus what requires help from a developer.

#### Changes You CAN Make (in Admin Settings)

These are designed to be changed by you at any time:

*   ✅ **The Definition of a Scoring Rule**: You can rewrite the text description for any of the C1-C10 criteria.
*   ✅ **The Weightage of a Scoring Rule**: You can change the numerical value to make a rule more or less important.

#### Changes That Require a Developer

These elements are part of the application's core code and are not available in the Admin Settings. If you need to change any of these, please contact a developer.

*   ❌ **Page Titles and Subtitles**: General text on the page, like `"Ten Key Behavioral Criteria"` or `"Four simple steps"`, is part of the design and requires code changes to be updated.
*   ❌ **The Total Number of Rules**: The system is built for 10 scoring rules. Changing this to 9 or 11 would require significant code changes.
*   ❌ **Table Headers in Reports**: The column titles in the audit dashboard (e.g., "C1 Score", "C2 Score") are hard-coded. A developer must change these if you want them to read differently (e.g., "Greeting Score").
*   ❌ **Core AI Analysis Rules**: The deep-down logic the AI uses, such as what counts as a "long pause" (e.g., a 4-second gap), is part of the backend code and cannot be changed from the Admin UI.