
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
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const checkRole = async () => {
            if (user) {
                const userDocRef = doc(db, 'allowedUsers', user.email!);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userRole = userDoc.data().role;
                    if (userRole === 'admin' || userRole === 'qa_reviewer') {
                        setIsAuthorized(true);
                    } else {
                        router.push('/');
                    }
                } else {
                    router.push('/');
                }
            }
            setLoading(false);
        };

        checkRole();
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

    if (!isAuthorized) {
        // This is a fallback, but the redirect should have already happened.
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p>Access Denied. You do not have permission to view this page.</p>
                </div>
            </div>
        )
    }

    return <AdminDashboard />;
}
