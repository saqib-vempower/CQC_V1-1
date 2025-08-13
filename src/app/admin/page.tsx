
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/cqc/auth-provider';
import { Header } from '@/components/cqc/header';
import { AdminDashboard } from '@/components/cqc/admin-dashboard';
import type { StoredCallRecord } from '@/ai/flows/get-all-calls';


export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const checkAdminRole = async () => {
            if (user) {
                const userDocRef = doc(db, 'allowedUsers', user.email!);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setIsAdmin(true);
                } else {
                    // If not an admin, redirect to the main dashboard
                    router.push('/');
                }
            }
            setLoading(false);
        };

        checkAdminRole();
    }, [user, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p>Loading and verifying access...</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        // This is a fallback, but the redirect should have already happened.
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p>Access Denied. You are not an administrator.</p>
                </div>
            </div>
        )
    }

    return <AdminDashboard />;
}
