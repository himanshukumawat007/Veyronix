import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Global handler to gracefully suppress the known Firebase Auth 12.19.0 internal assertion bug
// (INTERNAL ASSERTION FAILED: Pending promise was never set) when popups are blocked in sandboxed iframes
if (typeof window !== 'undefined') {
  const isAssertionError = (msg?: unknown): boolean => {
    const text = typeof msg === 'string' ? msg : String(msg || '');
    return (
      text.includes('Pending promise was never set') ||
      text.includes('INTERNAL ASSERTION FAILED') ||
      text.includes('auth/cancelled-popup-request') ||
      text.includes('auth/popup-blocked')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || event.reason?.code || String(event.reason || '');
    if (isAssertionError(reasonMsg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || event.error?.message || '';
    if (isAssertionError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});
