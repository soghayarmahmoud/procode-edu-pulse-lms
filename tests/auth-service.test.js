// tests/auth-service.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../js/services/auth-service.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Firebase
vi.mock('../js/services/firebase-config.js', () => ({
  auth: {},
  isFirebaseConfigured: () => false
}));

vi.mock('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('../js/services/firestore-service.js', () => ({
  firestoreService: {}
}));

describe('AuthService', () => {
  beforeEach(() => {
    // Reset state
    authService._user = null;
    authService._profile = null;
    authService._initialized = false;
    authService._initPromise = null;
    authService._listeners = [];
    localStorage.clear();
  });

  it('should initialize without Firebase', async () => {
    await authService.init();
    expect(authService._initialized).toBe(true);
  });

  it('should sign up and sign in locally', async () => {
    const signupUser = await authService.signUp('test@example.com', 'password123', 'Test User');
    expect(signupUser).toHaveProperty('uid');
    expect(signupUser.email).toBe('test@example.com');
    
    const signinUser = await authService.signIn('test@example.com', 'password123');
    expect(signinUser.email).toBe('test@example.com');
  });

  it('should sign in with Google locally', async () => {
    const user = await authService.signInWithGoogle();
    expect(user).toHaveProperty('uid');
    expect(user.displayName).toBe('Local Google User');
  });
});