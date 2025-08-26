'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageCardLayout } from "@/components/ui/PageCardLayout"; // Import the new layout
import withAuthorization from '@/components/withAuthorization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


function RoleAssignmentPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Function to generate a random, secure temporary password
  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-10);
  };

  const handleCreateUser = async () => {
    if (!email || !role) {
      setFeedback({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);

    const tempPassword = generateTempPassword();

    try {
      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: tempPassword,
          role,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFeedback({ type: 'success', message: `User created successfully! Temporary password: ${tempPassword}` });
        // Clear form
        setEmail('');
        setRole('');
      } else {
        setFeedback({ type: 'error', message: result.message || 'An unknown server error occurred.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to connect to the server. Please check your network connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/admin');
  };

  return (
    <>
      <AlertDialog open={!!feedback} onOpenChange={() => setFeedback(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{feedback?.type === 'success' ? 'Success' : 'Action Failed'}</AlertDialogTitle>
          </AlertDialogHeader>
          <p>{feedback?.message}</p>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFeedback(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageCardLayout
        title="User Role Management"
        description="Create a new user and assign them a role. Provide them with the generated temporary password."
        headerContent={<Button variant="outline" onClick={handleBack}>Back</Button>}
      >
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">User Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="new.user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Assign Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2">
            <Button onClick={handleCreateUser} className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
          </div>
        </div>
      </PageCardLayout>
    </>
  );
}

// Secure this page, allowing only Admins to access it.
export default withAuthorization(RoleAssignmentPage, ['Admin']);
