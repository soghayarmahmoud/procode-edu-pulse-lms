// src/utils/auth.js
export function getAuthErrorMessage(code, fallbackMessage = '') {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/popup-blocked': 'Popup blocked by browser. Please allow popups for this site.',
        'auth/cancelled-popup-request': 'Sign-in request was cancelled.',
        'auth/unauthorized-domain': 'This domain is not authorized for this project. Please add it in Firebase Console.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Please enable it in Firebase Console.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
    };

      if (messages[code]) return messages[code];

      if (typeof fallbackMessage === 'string' && fallbackMessage.toLowerCase().includes('firebase is not configured')) {
        return 'Firebase is not configured. Create a .env file from .env.example and add your Firebase project keys.';
      }

      return fallbackMessage || 'An error occurred. Please try again.';
}