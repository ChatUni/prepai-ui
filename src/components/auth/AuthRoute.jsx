import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import userStore from '../../stores/userStore';

// AuthRoute checks if user is authenticated before rendering children
// If not authenticated, redirects to login with original location saved for redirect after login
const AuthRoute = observer(({ children }) => {
  const location = useLocation();
  
  if (!userStore.isLoggedIn) {
    // Redirect to login page, but save the current location so we can
    // redirect back after successful login
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // User is authenticated, render the protected route
  return children;
});

export default AuthRoute;