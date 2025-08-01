import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import userStore from '../../stores/userStore';

// Higher-order component that provides authentication logging and handling
const AuthWrapper = observer(({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('logged in: ', userStore.isLoggedIn)
    // If on login page but already logged in, redirect to original page or home
    if (location.pathname === '/login' && userStore.isLoggedIn) {
      const destination = location.state?.from?.pathname || '/';
      console.log('Already logged in, redirecting from login to:', destination);
      navigate(destination, { replace: true });
    }
  }, [location, navigate, userStore.isLoggedIn]);

  // Just render children, actual auth protection is in AuthRoute
  return children;
});

export default AuthWrapper;