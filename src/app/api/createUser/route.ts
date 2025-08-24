import { NextResponse } from 'next/server';
import { adminAuth, adminDb, initializationError } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  // --- Health Check ---
  // If the admin SDK failed to initialize, report the captured error immediately.
  if (initializationError) {
    console.error("API call failed due to initialization error:", initializationError);
    return NextResponse.json({
      success: false,
      message: `Server configuration error: ${initializationError.message}`
    }, { status: 500 });
  }

  try {
    const { email, password, role } = await request.json();

    // 1. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
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
    // This will now catch specific errors from createUser (e.g., "email-already-exists")
    console.error("--- Create User API route CRASHED ---");
    console.error("Specific Firebase error:", error);
    
    let errorMessage = "An unexpected error occurred.";
    if (error.code) {
      // Use Firebase's specific error message if available
      errorMessage = `Firebase Error: ${error.code.replace('auth/', '')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}
