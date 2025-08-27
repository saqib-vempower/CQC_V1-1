import { NextResponse } from 'next/server';
import { adminAuth, adminDb, initializationError } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    if (initializationError) {
        console.error("Create user failed due to Firebase Admin SDK initialization error:", initializationError);
        return NextResponse.json(
            { success: false, message: `Server configuration error: ${initializationError.message}` },
            { status: 500 }
        );
    }

    if (!adminAuth || !adminDb) {
         console.error("Create user failed: adminAuth or adminDb is null after initialization check.");
         return NextResponse.json(
             { success: false, message: "Internal server error: Firebase Admin SDK not properly initialized." },
             { status: 500 }
         );
    }

    try {
        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ success: false, message: 'Missing email, password, or role' }, { status: 400 });
        }

        // 1. Create the user in Firebase Authentication
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
        });

        const userId = userRecord.uid;

        // 2. Set the custom role claim for the new user
        await adminAuth.setCustomUserClaims(userId, { role: role });

        // 3. Store user data (including role) in Firestore
        await adminDb.collection('users').doc(userId).set({
            email: email,
            role: role,
            createdAt: new Date().toISOString(),
        });

        console.log(`Successfully created user "${email}" with role "${role}" and UID "${userId}"`);
        return NextResponse.json({ success: true, message: 'User created successfully', userId: userId });

    } catch (error: any) {
        console.error('Error creating user:', error);
        
        let errorMessage = 'Failed to create user.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'A user with this email address already exists.';
        } else if (error.code === 'auth/invalid-password') {
             errorMessage = 'The password must be at least 6 characters long.';
        }

        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
    }
}
