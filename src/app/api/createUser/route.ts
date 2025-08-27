// app/api/createUser/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();
    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Missing email, password, or role' }, { status: 400 });
    }

    const user = await adminAuth.createUser({ email, password });
    await adminAuth.setCustomUserClaims(user.uid, { role });
    await adminDb.collection('users').doc(user.uid).set({
      email, role, createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, userId: user.uid });
  } catch (error: any) {
    console.error('!!! CREATE USER FAILED !!!', error);
    // Provide a more specific error message based on the type of error
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email address is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'The password must be a string with at least six characters.';
    } else if (error.codePrefix === 'app') { // Check for initialization errors
        errorMessage = 'Server configuration error. Please check the server logs.';
    }
    return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
  }
}
