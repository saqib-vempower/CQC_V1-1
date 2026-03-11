'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Define the props for the wrapper component
interface WithAuthorizationProps {
  allowedRoles: string[];
}

// This is a Higher-Order Component (HOC)
const withAuthorization = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  const ComponentWithAuth = (props: P) => {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
      if (!loading) {
        // If not loading, check for user and role
        if (!user) {
          // If no user, redirect to login
          router.replace('/login');
        } else if (userRole && !allowedRoles.includes(userRole)) {
          // If user has a role but it's not allowed, redirect to their home page
          router.replace(`/${userRole.toLowerCase()}`);
        } else if (!userRole) {
            // If user exists but has no role, redirect to login with an error
            // (This is a failsafe for incomplete user profiles)
            router.replace('/login');
        } else {
          setIsAuthorized(true);
        }
      }
    }, [user, userRole, loading, router]);

    // While loading, or if user is not authorized, render a loading state or nothing
    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      );
    }

    // If authorized, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuthorization(ToolPage, ['Admin', 'QA']);
