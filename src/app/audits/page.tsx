'use client';

import { CallUploadForm } from '@/components/cqc/call-upload-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditsPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>New Audit</CardTitle>
            <CardDescription>Upload a call recording to be transcribed, scored, and analyzed.</CardDescription>
        </CardHeader>
        <CardContent>
            <CallUploadForm />
        </CardContent>
    </Card>
  );
}
