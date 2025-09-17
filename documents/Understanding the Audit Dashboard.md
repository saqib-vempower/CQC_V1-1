# Understanding the Audit Dashboard

This guide is for all users of the AI-powered Call Auditing Tool, including agents, QA staff, and administrators. Its purpose is to help you understand the information presented on the audit dashboards and how to use it for coaching, quality assurance, and self-improvement.

---

### Part 1: The Main Dashboard (`/dashboard`)

When you first navigate to the dashboard, you will see a table listing all the call audits you have permission to view.

#### Key Columns:
*   **Overall Score**: The final, weighted score for the call, out of 100.
*   **Agent Name**: The agent who handled the call.
*   **Call Date**: The date the call took place.
*   **Status**: The current state of the audit (`completed`, `processing`, `error`).
*   **C1 Score - C10 Score**: A quick view of the individual scores for each of the ten scoring criteria.

From here, you can click on any individual row to open the **Detailed Audit View**.

---

### Part 2: The Detailed Audit View

This is where you can dive into the specifics of a single call audit. This view typically includes:

1.  **The Overall Score**: Displayed prominently at the top.
2.  **The Full Transcript**: The complete text of the conversation. You can read through it to understand the context of the AI's analysis.
3.  **AI-Generated Feedback**: A summary from the AI explaining its reasoning for the scores, highlighting both strengths and areas for improvement.
4.  **The Scorecard**: A detailed breakdown of the scores for each of the ten key criteria.

---

### Part 3: Understanding Your Score - The Rubric

Your score is based on a rubric of **Ten Key Behavioral Criteria**. Each criterion is weighted to contribute to a total of 100 points.

#### The Scoring Criteria (C1-C10):

While the exact definitions and weights can be changed by an administrator, the standard criteria are:

*   **C1**: Professional Tone & Language
*   **C2**: Active Listening & Empathy (Weight: 12)
*   **C3**: Clarity & Organization (Weight: 10)
*   **C4**: Managing Holds, Pauses & Lookups (Weight: 12)
*   **C5**: Probing & Clarification (Weight: 8)
*   **C6**: Information Delivery & Handoff (Weight: 10)
*   **C7**: Handling Student Decisions (Weight: 12)
*   *And others, up to C10, for a total of 100 points.*

---

### Part 4: How the AI Justifies the Score (The "Why")

The AI doesn't just guess the scores. It calculates objective, measurable data points from the call, which we call **"Observables."** These observables directly influence the final scores.

Here are a few examples to help you understand how this works:

#### Example 1: **C4 - Managing Holds, Pauses & Lookups**
*   **What the AI does:** The AI analyzes the time gaps between utterances in the conversation. It specifically counts how many times there is a pause of **4 seconds or more** (`gapsOver4s`).
*   **How it affects the score:** A higher number of long pauses will directly lead to a lower score for the C4 criterion. The AI provides this hard data as evidence for its assessment.

#### Example 2: **C6 - Information Delivery & Handoff**
*   **What the AI does:** The AI is trained to listen for specific "signpost" phrases that indicate good call management during a lookup. It checks if phrases like *"one moment"*, *"let me check"*, or *"thanks for waiting"* are present (`signpostPresent`).
*   **How it affects the score:** The presence of these phrases can positively influence the C6 score, as it shows the agent is effectively managing the call flow.

#### Example 3: **Active Listening (Influences C2)**
*   **What the AI does:** The AI calculates the total talk time for both the agent (`agentUtterances`) and the caller (`callerUtterances`).
*   **How it affects the score:** While not a direct 1-to-1 measure, this data helps the AI determine if the conversation was balanced. If the agent's talk time is excessively high compared to the caller's, it might indicate a lack of active listening, which could lower the C2 score.

By understanding these observables, you can see that the scores are not arbitrary. They are backed by specific, data-driven evidence from the call itself. Always read the AI feedback and review the transcript to get the full picture and identify clear, actionable steps for improvement.

---

### Part 5: Other Key Pages (For Admins and QA)

In addition to the main dashboard, administrators and QA staff have access to other powerful pages.

#### The Macro Dashboard (`/macro-dashboard`)

*   **What is its purpose?** This dashboard provides a "big picture" view of performance. Instead of looking at one call at a time, it shows you trends and averages across many calls.
*   **Who is it for?** Primarily for **Admins** and **QA** team members who need to spot larger patterns in performance.
*   **What can you learn from it?**
    *   "What is the average team score for 'C2: Active Listening' this month compared to last month?"
    *   "Which scoring criteria are most frequently missed across all agents?"
    *   "Is there a correlation between call duration and overall score?"

#### The Tool Page (`/tool`)

*   **What is its purpose?** This page is for performing specific actions and operational tasks related to call audits.
*   **Who is it for?** **Admins** and **QA** staff who manage the auditing process.
*   **What can you do here?**
    *   **Manually Upload a New Call:** You can upload a new audio file for auditing directly from this page.
    *   **Initiate a Re-Audit:** If you need to re-process a call with updated scoring rules or because of a suspected error, you can trigger a re-audit here.