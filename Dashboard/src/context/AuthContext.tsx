import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isFieldOperator?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAsFieldEngineer: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isSigningIn: false,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => ({ success: false }),
  signInAsFieldEngineer: async () => {},
  signOut: async () => {},
});

const FIELD_OPERATOR_TOKEN = 'dev-operator-token-field-01';
const FIELD_OPERATOR_STORAGE_KEY = 'bhu_drishti_field_operator';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);

  const syncUserWithBackend = async (idToken: string, displayName?: string | null, email?: string | null) => {
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: displayName || 'Geotech Operator',
          email: email || 'operator@bhu-drishti.local',
        }),
      });
    } catch (err) {
      console.warn('User profile sync notice:', err);
    }
  };

  useEffect(() => {
    // Check if field operator mode was previously activated
    const savedFieldOp = localStorage.getItem(FIELD_OPERATOR_STORAGE_KEY);
    if (savedFieldOp === 'true') {
      const fieldUser: AppUser = {
        uid: 'operator-bhu-field-01',
        email: 'engineer@bhu-drishti.local',
        displayName: 'Field Geotech Engineer',
        photoURL: null,
        isFieldOperator: true,
      };
      setUser(fieldUser);
      setToken(FIELD_OPERATOR_TOKEN);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isFieldOperator: false,
        };
        setUser(appUser);
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          await syncUserWithBackend(idToken, currentUser.displayName, currentUser.email);
        } catch (err) {
          console.warn('Failed to retrieve token or sync user:', err);
        }
      } else {
        // Only clear if not in field operator mode
        setUser((prev) => (prev?.isFieldOperator ? prev : null));
        setToken((prev) => (prev?.startsWith('dev-operator-') ? prev : null));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSigningInRef.current) {
      return { success: false, error: 'Sign-in already in progress' };
    }

    isSigningInRef.current = true;
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const appUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        isFieldOperator: false,
      };

      localStorage.removeItem(FIELD_OPERATOR_STORAGE_KEY);
      setUser(appUser);
      setToken(idToken);
      await syncUserWithBackend(idToken, result.user.displayName, result.user.email);
      return { success: true };
    } catch (error: any) {
      const errorCode = error?.code || '';
      let message = '';

      if (errorCode === 'auth/popup-blocked') {
        message = 'Popups were blocked by your browser inside the preview iframe. You can open in a new tab or use 1-click Field Operator sign-in.';
      } else if (errorCode === 'auth/cancelled-popup-request') {
        // Debounced cancellation - no user alert needed
        return { success: false };
      } else if (errorCode === 'auth/popup-closed-by-user') {
        return { success: false };
      } else {
        message = error?.message || 'Google sign-in could not be completed.';
      }

      setAuthError(message);
      return { success: false, error: message };
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signInAsFieldEngineer = async () => {
    const fieldUser: AppUser = {
      uid: 'operator-bhu-field-01',
      email: 'engineer@bhu-drishti.local',
      displayName: 'Field Geotech Engineer',
      photoURL: null,
      isFieldOperator: true,
    };

    localStorage.setItem(FIELD_OPERATOR_STORAGE_KEY, 'true');
    setUser(fieldUser);
    setToken(FIELD_OPERATOR_TOKEN);
    setAuthError(null);

    await syncUserWithBackend(FIELD_OPERATOR_TOKEN, fieldUser.displayName, fieldUser.email);
  };

  const signOut = async () => {
    localStorage.removeItem(FIELD_OPERATOR_STORAGE_KEY);
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore errors on sign out
    }
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSigningIn,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInAsFieldEngineer,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
