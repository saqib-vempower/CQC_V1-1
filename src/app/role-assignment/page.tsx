'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        // THIS IS THE CRITICAL CHANGE: We now display the specific error from the server.
        setFeedback({ type: 'error', message: result.message || 'An unknown server error occurred.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to connect to the server. Please check your network connection.' });
    } finally {
      setIsLoading(false);
    }
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

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>User Role Management</CardTitle>
              <CardDescription>
                Create a new user and assign them a role. Provide them with the generated temporary password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="new.user@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Assign Role</Label>
                  <Select value={role} onValueChange={setRole}>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Secure this page, allowing only Admins to access it.
export default withAuthorization(RoleAssignmentPage, ['Admin']);
