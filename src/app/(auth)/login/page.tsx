
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAuth = async (authAction: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      if (authAction === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const usersCollection = collection(db, 'users');
        const userDocs = await getDocs(usersCollection);
        const isAdmin = userDocs.empty;

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: isAdmin ? 'Admin' : 'Agent',
        });
        toast({ title: 'Sign Up Successful', description: 'Your account has been created.' });
      }
      router.push('/home');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <Home />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
          </div>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={() => handleAuth('login')} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 animate-spin" />}
            Sign in
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleAuth('signup')} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 animate-spin" />}
            Sign up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
