# Backup and Restore Procedures

This document provides a high-level overview and instructions for backing up and restoring the data for the AI-powered Call Auditing Tool.

**Disclaimer:** These are critical administrative tasks that can have a significant impact on your application. These procedures should only be performed by an IT professional or a qualified system administrator who understands the Firebase and Google Cloud ecosystem. Incorrectly performing a restore can lead to permanent data loss.

---

### What Data Needs to Be Backed Up?

Your application has two primary types of data that must be backed up separately:

1.  **Firestore Database:** This contains all the structured data for your application, including user roles (`users` collection), audit records (`audits` collection), and dynamic scoring rules (`settings` collection).
2.  **Firebase Storage:** This contains all the raw audio files for the call audits, typically stored in the `audits` folder of your storage bucket.

---

## Part 1: Backing Up Your Data

Backups should be performed regularly and automatically to ensure you can recover from any unforeseen data loss.

### A. Backing Up the Firestore Database

The recommended method for backing up Firestore is to use the Google Cloud command-line tool (`gcloud`) to perform a full export of the database to a separate Google Cloud Storage bucket.

#### **Step-by-Step Instructions:**

1.  **Create a dedicated backup bucket:** In the Google Cloud Console, create a new Cloud Storage bucket. This bucket should be in the same location as your Firestore database and will be used exclusively for storing your database backups.
2.  **Open the Google Cloud Shell or a local terminal** with `gcloud` installed and authenticated.
3.  **Set your project:**
    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```
    (Replace `YOUR_PROJECT_ID` with your actual Google Cloud project ID).
4.  **Run the export command:**
    ```bash
    gcloud firestore export gs://YOUR_BACKUP_BUCKET
    ```
    (Replace `YOUR_BACKUP_BUCKET` with the name of the backup bucket you created in step 1).

#### **Automation (Recommended):**
For regular backups, this export process can be automated using **Cloud Scheduler**. You can create a scheduler job that triggers a Cloud Function or uses an App Engine cron job to run the export command on a daily or weekly basis.

### B. Backing Up Firebase Storage (Audio Files)

Audio files in Firebase Storage can be backed up by synchronizing them to another, separate Cloud Storage bucket.

#### **Step-by-Step Instructions:**

1.  **Create a dedicated backup bucket** for your audio files, similar to the one for Firestore.
2.  **Use the `gsutil` command-line tool** to synchronize the contents of your main storage bucket to the backup bucket.
3.  **Run the sync command:**
    ```bash
    gsutil -m rsync -r gs://YOUR_PROJECT_STORAGE_BUCKET/audits gs://YOUR_STORAGE_BACKUP_BUCKET/audits
    ```
    (Replace `YOUR_PROJECT_STORAGE_BUCKET` with your project's default storage bucket name and `YOUR_STORAGE_BACKUP_BUCKET` with your backup bucket's name).

#### **Automation (Recommended):**
You can automate this process using **Cloud Scheduler** and a Cloud Function, or by using the **Storage Transfer Service** within Google Cloud to set up a recurring transfer job.

---

## Part 2: Restoring Your Data

**WARNING: Restoring data will overwrite existing data in your database and storage. This action is irreversible. Proceed with extreme caution and only in a genuine emergency.**

### A. Restoring the Firestore Database

You can restore your database from a previous export stored in your backup bucket.

1.  **Open the Google Cloud Shell or a local terminal.**
2.  **Run the import command:**
    ```bash
    gcloud firestore import gs://YOUR_BACKUP_BUCKET/YYYY-MM-DDTHH:MM:SS_#####
    ```
    (You must specify the full path to the backup folder created during the export process).

### B. Restoring Firebase Storage (Audio Files)

You can restore your audio files by syncing them back from your backup bucket to your main application bucket.

1.  **Run the sync command in reverse:**
    ```bash
    gsutil -m rsync -r gs://YOUR_STORAGE_BACKUP_BUCKET/audits gs://YOUR_PROJECT_STORAGE_BUCKET/audits
    ```

By establishing and automating these backup procedures, you ensure the long-term safety and recoverability of your application's critical data.