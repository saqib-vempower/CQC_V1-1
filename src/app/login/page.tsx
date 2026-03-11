'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase-client';

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    const { auth, db } = getFirebaseServices();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 🔹 Login user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      // 🔹 Fetch role from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let role = "";

      if (docSnap.exists()) {
        role = (docSnap.data().role as string) || "";
      }

      // 🔹 Redirect based on role
      switch (role.toLowerCase()) {
        case "admin":
          router.push("/admin");
          break;

        case "qa":
          router.push("/qa");
          break;

        case "agent":
          router.push("/agent");
          break;

        default:
          router.push("/dashboard");
          break;
      }

    } catch (err: any) {

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email"
      ) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(`An unexpected error occurred: ${err.message}`);
      }

    } finally {
      setLoading(false);
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
            <AlertDialogAction onClick={() => setError('')}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">

          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-muted-foreground">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
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
