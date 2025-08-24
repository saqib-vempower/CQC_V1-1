import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    // 1. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      emailVerified: true, // You can decide if you want to verify emails
      disabled: false,
    });

    // 2. Set the custom role in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: email,
      role: role,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: `User ${email} created successfully with role ${role}.`
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred."
    }, { status: 500 });
  }
}
