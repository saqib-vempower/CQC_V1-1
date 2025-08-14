
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
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';

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

// Helper function to initialize Firebase Admin SDK if not already done.
const getAdminApp = (): App => {
    if (getApps().length) {
        return getApps()[0]!;
    }
    return initializeApp();
};

// Helper function to get authenticated Google Sheets client
const getSheetsClient = () => {
    getAdminApp(); // Ensure Firebase Admin is initialized, needed for project context
    
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    return google.sheets({ version: 'v4', auth });
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
