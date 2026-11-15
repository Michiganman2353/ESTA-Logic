import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { loadApprovedAccount } from '@/lib/accountAccess';
import type { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);

  const resolve = useCallback(async (identity: FirebaseUser | null) => {
    const request = ++revision.current;
    setCurrentUser(identity);
    setUserData(null);
    setError(null);
    setLoading(true);
    try {
      const account = identity ? await loadApprovedAccount(identity) : null;
      if (request === revision.current) setUserData(account);
    } catch (failure) {
      if (request === revision.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Unable to load your account. Please try again.'
        );
      }
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (identity) => {
      void resolve(identity);
    });
    return () => {
      ++revision.current;
      unsubscribe();
    };
  }, [resolve]);

  async function refreshUserData() {
    await resolve(auth?.currentUser ?? null);
  }

  async function signOut() {
    if (!auth) throw new Error('Firebase Auth not configured');
    ++revision.current;
    setUserData(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setError(null);
    } catch {
      setError('Sign-out could not be completed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        error,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
