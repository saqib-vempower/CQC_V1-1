
'use server';

/**
 * @fileOverview A flow to export call analysis records to Google Sheets.
 *
 * - exportToSheets - A function that handles exporting data.
 * - ExportToSheetsInput - The input type for the exportToSheets function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';
import type { StoredCallRecord } from './get-all-calls';
import { credential, getApps, initializeApp } from 'firebase-admin/app';

const ExportToSheetsInputSchema = z.object({
  records: z.array(z.any()).describe("An array of call records to export."),
});

export type ExportToSheetsInput = z.infer<typeof ExportToSheetsInputSchema>;

const SHEET_IDS: Record<string, string | undefined> = {
  'Catholic University of America': process.env.SHEET_ID_CUA,
  'Rochester Institute of Technology': process.env.SHEET_ID_RIT,
  'Illinois Institute of Technology': process.env.SHEET_ID_IIT,
  'Saint Louis University': process.env.SHEET_ID_SLU,
  'DePaul University': process.env.SHEET_ID_DPU,
  'Rockhurst University': process.env.SHEET_ID_RU,
};

// Helper function to get authenticated Google Sheets client
const getSheetsClient = () => {
    // Ensure Firebase Admin is initialized to leverage its authentication context if needed
    if (!getApps().length) {
        if (process.env.GOOGLE_CREDENTIALS) {
            try {
                const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                initializeApp({
                    credential: credential.cert(serviceAccount),
                });
            } catch (e) {
                console.error("Failed to parse GOOGLE_CREDENTIALS:", e);
            }
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
             initializeApp({
                credential: credential.applicationDefault(),
            });
        } else {
            initializeApp();
        }
    }
    
    // Check for explicit service account credentials in env for Google Sheets API
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return google.sheets({ version: 'v4', auth });
        } catch (e) {
            console.error("Failed to parse GOOGLE_CREDENTIALS for Sheets:", e);
        }
    }
    
    // Fallback to application default credentials if available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return google.sheets({ version: 'v4', auth });
    }

    throw new Error("Google credentials are not set up correctly.");
};

export async function exportToSheets(input: ExportToSheetsInput): Promise<{ success: boolean; message: string; }> {
  return exportToSheetsFlow(input);
}

const exportToSheetsFlow = ai.defineFlow(
  {
    name: 'exportToSheetsFlow',
    inputSchema: ExportToSheetsInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ records }) => {
    try {
        const sheets = getSheetsClient();
        
        // Group records by university
        const recordsByUniversity: Record<string, StoredCallRecord[]> = {};
        for (const record of records) {
            const typedRecord = record as StoredCallRecord;
            if (!recordsByUniversity[typedRecord.universityName]) {
                recordsByUniversity[typedRecord.universityName] = [];
            }
            recordsByUniversity[typedRecord.universityName].push(typedRecord);
        }

        for (const universityName in recordsByUniversity) {
            const spreadsheetId = SHEET_IDS[universityName];
            if (!spreadsheetId) {
                console.warn(`No sheet ID configured for university: ${universityName}`);
                continue;
            }

            const universityRecords = recordsByUniversity[universityName];

            // Further group by domain to target specific tabs
            const recordsByDomain: Record<string, StoredCallRecord[]> = {};
            for (const record of universityRecords) {
                if (!recordsByDomain[record.domain]) {
                    recordsByDomain[record.domain] = [];
                }
                recordsByDomain[record.domain].push(record);
            }
            
            for (const domain in recordsByDomain) {
                // Assuming domain names match tab names (e.g., 'Support', 'Reach', 'Connect')
                const tabName = domain;
                const domainRecords = recordsByDomain[domain];

                const header = [
                    'ID', 'Agent Name', 'Applicant ID', 'Domain', 'Call Date', 'Sentiment', 
                    'Opening', 'Active Listening', 'Problem Solving', 'Professionalism', 'Closing',
                    'Agent Behavior Assessment', 'Feedback', 'Coaching Tips', 'Transcript'
                ];
                
                const rows = domainRecords.map(rec => [
                    rec.id,
                    rec.agentName,
                    rec.applicantId,
                    rec.domain,
                    rec.callDate,
                    rec.sentiment,
                    rec.rubricScores['Opening'] || '',
                    rec.rubricScores['Active Listening'] || '',
                    rec.rubricScores['Problem Solving'] || '',
                    rec.rubricScores['Professionalism'] || '',
                    rec.rubricScores['Closing'] || '',
                    rec.analysis.agentBehaviorAssessment,
                    rec.analysis.feedback,
                    rec.coachingTips.join('\\n'),
                    rec.transcript
                ]);

                const resource = {
                    values: [header, ...rows],
                };

                // Clear the specific tab before updating
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: tabName, // Clears the entire tab
                });

                // Write the new data to the tab
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${tabName}!A1`, // Start at the beginning of the specified tab
                    valueInputOption: 'RAW',
                    requestBody: resource,
                });
            }
        }

        return { success: true, message: 'Export successful!' };
    } catch (error) {
        console.error('Failed to export to Google Sheets:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Export failed: ${errorMessage}` };
    }
  }
);
