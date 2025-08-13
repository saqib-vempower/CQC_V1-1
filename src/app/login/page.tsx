
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/cqc/header';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });
  
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setIsLoading(true);
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          // User opened the link on a different device. To prevent session fixation
          // attacks, ask the user to provide the email again.
          email = window.prompt('Please provide your email for confirmation');
        }

        if (!email) {
            toast({ variant: 'destructive', title: 'Login Failed', description: 'Email is required to complete sign-in.' });
            setIsLoading(false);
            return;
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          toast({ title: 'Login Successful', description: "You've been successfully logged in." });
          router.push('/home');
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Login Failed', description: 'The sign-in link is invalid or has expired.' });
        } finally {
          setIsLoading(false);
        }
      }
    };
    handleEmailLinkSignIn();
  }, [router, toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const actionCodeSettings = {
      // URL to redirect back to. The domain (www.example.com) must be authorized
      // in the Firebase console.
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', values.email);
      toast({
        title: 'Check your email',
        description: `A sign-in link has been sent to ${values.email}.`,
      });
      setEmailSent(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: 'Could not send sign-in link. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              {emailSent 
                ? 'Check your inbox for a magic link to sign in.'
                : 'Enter your email below to receive a login link.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
                 <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                   <FormField
                     control={form.control}
                     name="email"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Email</FormLabel>
                         <FormControl>
                           <Input
                             placeholder="m@example.com"
                             {...field}
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Send Login Link
                   </Button>
                 </form>
               </Form>
            ) : (
                <div className="text-center text-sm text-muted-foreground">
                    <p>You can close this tab.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
