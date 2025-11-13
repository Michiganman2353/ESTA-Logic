// src/components/session/withAuthentication.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthUserListener } from '../firebase'; // From upgraded firebase.js
import { useFirebase } from '../firebase/context';

// Types
export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  roles: Record<string, string>;
  // Add more as needed
}

// Context type
interface AuthContextType {
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Default context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider (replaces HOC)
export const withAuthentication = ({ children }) => {
  const { firebase } = useFirebase();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = firebase.onAuthUserListener(
      (user) => {
        // Cache to IndexedDB for PWA offline (better than localStorage)
        if (typeof indexedDB !== 'undefined') {
          const request = indexedDB.open('ESTA_DB', 1);
          request.onerror = () => console.error('IndexedDB error');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            store.put(user, 'currentUser');
          };
        }
        setAuthUser(user);
        setError(null);
      },
      () => {
        // Clear cache
        if (typeof indexedDB !== 'undefined') {
          const request = indexedDB.open('ESTA_DB', 1);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            store.delete('currentUser');
          };
        }
        setAuthUser(null);
      }
    );

    // Fallback from IndexedDB on load (PWA offline)
    if (typeof indexedDB !== 'undefined') {
      const request = indexedDB.open('ESTA_DB', 1);
      request.onerror = () => console.error('IndexedDB error');
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const getRequest = store.get('currentUser');
        getRequest.onsuccess = () => {
          const cachedUser = getRequest.result;
          if (cachedUser) {
            setAuthUser(cachedUser);
          }
        };
      };
    }

    setLoading(false);

    return listener;
  }, [firebase]);

  const value = { authUser, loading, error };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Legacy HOC (for migration – remove later)
export const withAuth = (Component) => (props) => {
  const auth = useContext(AuthContext);
  return <Component {...props} auth={auth} />;
};

export default withAuthentication;