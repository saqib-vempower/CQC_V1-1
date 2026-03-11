'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { getFirebaseServices } from '@/lib/firebase-client';

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// The provider component that wraps the app and makes auth state available
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseServices();

    // Subscribe to ID token changes to get the user's role from custom claims
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Force refresh the token to get the latest custom claims
        const idTokenResult = await user.getIdTokenResult(true);
        const role = idTokenResult.claims.role as string || null;
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Value to be provided by the context
  const value = { user, userRole, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
