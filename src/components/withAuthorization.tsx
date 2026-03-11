'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// This is a Higher-Order Component (HOC) for authorization
const withAuthorization = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  const ComponentWithAuth = (props: P) => {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
      // Wait until the authentication state is fully loaded
      if (loading) {
        return; // Render nothing or a loading spinner while we check auth
      }

      // If loading is finished and there is no user, redirect to the login page
      if (!user) {
        router.replace('/login');
        return;
      }

      // Check if the user's role is one of the allowed roles (case-insensitive)
      const isAuthorized = userRole && allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

      if (!isAuthorized) {
        // If the user is not authorized, redirect them. 
        // If they have a role, send them to their default page; otherwise, send to home.
        const destination = userRole ? `/${userRole.toLowerCase()}` : '/';
        router.replace(destination);
      }
      // If the user is authorized, the component will render as normal.

    }, [user, userRole, loading, router]);

    // Determine if the user is authorized based on the current state
    const isAuthorized = !loading && user && userRole && allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

    // Render the wrapped component only if the user is authorized
    if (isAuthorized) {
      return <WrappedComponent {...props} />;
    } else {
      // Otherwise, render a loading state to prevent content flashing
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      );
    }
  };

  return ComponentWithAuth;
};

export default withAuthorization;
