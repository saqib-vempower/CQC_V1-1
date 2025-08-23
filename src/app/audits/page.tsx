import CallUploadForm from '@/components/cqc/call-upload-form';
import React from 'react';

export default function NewAuditPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">New Call Audit</h1>
      <CallUploadForm />
    </div>
  );
}
