// src/app/api/createUser/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb, initializationError } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  if (initializationError) {
    return NextResponse.json({ success: false, message: `Server configuration error: ${initializationError.message}` }, { status: 500 });
  }

  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields: email, password, and role.' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role });

    await adminDb.collection('users').doc(userRecord.uid).set({
      email: email,
      role: role,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use by another account.';
    } else if (error.code) {
      errorMessage = `Firebase Error: ${error.code}`;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
