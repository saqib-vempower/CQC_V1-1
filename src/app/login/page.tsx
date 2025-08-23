'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (email === '' || password === '') {
      setError('Please fill in all fields.');
      return;
    }

    try {
      // Note: This only handles auth. A real app would need user profile/role handling
      // which was removed as part of the cleanup.
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
      alert('Login successful! A real app would redirect to a dashboard here.');
      // router.push('/home'); // This route no longer exists
    } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            setError('Incorrect Password. Contact Admin for credentials.');
        } else {
            setError('An unexpected error occurred. Please try again.');
        }
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-1 xl:min-h-screen">
      <AlertDialog open={!!error} onOpenChange={() => setError('')}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Login Failed</AlertDialogTitle>
          </AlertDialogHeader>
          <p>{error}</p>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError('')}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
