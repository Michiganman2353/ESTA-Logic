// src/components/session/WithAuthorization.js
import React, { useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context'; // From upgraded withAuthentication
import * as ROUTES from '../../constants/routes';

// Types
export interface ConditionFn {
  (authUser: any): boolean;
}

// Hook
export const useAuthorization = (condition: ConditionFn) => {
  const { authUser, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthorized = useMemo(() => {
    if (loading) return null; // Wait for load
    if (error) return false; // Auth error
    if (!authUser) return false; // No user
    return condition(authUser);
  }, [authUser, loading, error, condition]);

  // Auto-redirect if unauthorized
  useEffect(() => {
    if (isAuthorized === false) {
      navigate(ROUTES.SIGN_IN, {
        state: { from: location },
        replace: true,
      });
    }
  }, [isAuthorized, navigate, location]);

  return { isAuthorized, loading, error };
};

// Legacy HOC (for migration – remove later)
export const withAuthorization = (condition: ConditionFn) => (Component) => (props) => {
  const { isAuthorized, loading, error } = useAuthorization(condition);
  if (loading) return <div>Loading...</div>;
  if (error || !isAuthorized) return null;
  return <Component {...props} />;
};

export default withAuthorization;