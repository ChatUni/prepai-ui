import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import userStore from '../../stores/userStore';

// Higher-order component that provides authentication logging and handling
const AuthWrapper = observer(({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log authentication state on each route change
    console.log('Auth state check on route:', location.pathname, 
      'isLoggedIn:', userStore.userInfo.isLoggedIn,
      'from:', location.state?.from?.pathname);
      
    // If on login page but already logged in, redirect to original page or home
    if (location.pathname === '/login' && userStore.userInfo.isLoggedIn) {
      const destination = location.state?.from?.pathname || '/';
      console.log('Already logged in, redirecting from login to:', destination);
      navigate(destination, { replace: true });
    }
  }, [location, navigate, userStore.userInfo.isLoggedIn]);

  // Just render children, actual auth protection is in AuthRoute
  return children;
});

export default AuthWrapper;