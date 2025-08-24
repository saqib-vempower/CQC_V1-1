'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import withAuthorization from '@/components/withAuthorization';

function ToolPage() {
  const handleUpload = () => {
    alert('File upload functionality will be implemented here.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Call Processing Tool</CardTitle>
            <CardDescription>
              Upload a new call recording (MP3 format) and provide metadata for processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="call-file">Call Recording File</Label>
                <Input id="call-file" type="file" accept=".mp3,audio/mpeg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input id="agent-name" placeholder="e.g., Jane Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="call-type">Call Type</Label>
                <Input id="call-type" placeholder="e.g., Sales Inquiry, Technical Support" />
              </div>
              <div className="mt-2">
                <Button onClick={handleUpload} className="w-full">
                  Upload and Process Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Apply the security wrapper to the ToolPage
export default withAuthorization(ToolPage, ['Admin', 'QA']);
