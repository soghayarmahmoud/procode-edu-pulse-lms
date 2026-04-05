import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth-service.js';

// Mock Firebase config
vi.mock('../firebase-config.js', () => ({
    auth: {},
    isFirebaseConfigured: () => true
}));

// Mock Firebase auth functions
vi.mock('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: class {},
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, cb) => {
        // Mock instant resolve for initialization
        setTimeout(() => cb(null), 10);
    }),
    updateProfile: vi.fn()
}));

// Mock firestoreService
vi.mock('../firestore-service.js', () => ({
    firestoreService: {
        getUserProfile: vi.fn().mockResolvedValue({ isAdmin: false })
    }
}));

describe('AuthService', () => {
    beforeEach(() => {
        // Reset state before each test
        authService._user = null;
        authService._profile = null;
        authService._initialized = false;
        authService._initPromise = null;
        authService._listeners = [];
        vi.clearAllMocks();
    });

    it('should initialize correctly with no user', async () => {
        const user = await authService.init();
        expect(user).toBeNull();
        expect(authService.isLoggedIn()).toBe(false);
    });

    it('should correctly identify when a user is logged in', () => {
        authService._user = { uid: '123', email: 'test@test.com' };
        expect(authService.isLoggedIn()).toBe(true);
        expect(authService.getUid()).toBe('123');
        expect(authService.getEmail()).toBe('test@test.com');
    });

    it('should format display names correctly', () => {
        // Null user
        authService._user = null;
        expect(authService.getDisplayName()).toBe('Student');

        // Email fallback
        authService._user = { email: 'john.doe@gmail.com' };
        expect(authService.getDisplayName()).toBe('john.doe');

        // Explicit display name
        authService._user = { displayName: 'John Doe', email: 'john.doe@gmail.com' };
        expect(authService.getDisplayName()).toBe('John Doe');
    });

    it('should evaluate admin privileges synchronously', () => {
        authService._profile = null;
        expect(authService.isAdminSync()).toBe(false);

        authService._profile = { isAdmin: true };
        expect(authService.isAdminSync()).toBe(true);
        
        authService._profile = { profile: { isAdmin: true } };
        expect(authService.isAdminSync()).toBe(true);
    });

    it('should evaluate instructor and admin privileges for super-access emails', () => {
        authService._user = { email: 'mahmoudsruby@gmail.com' };
        expect(authService.isAdminSync()).toBe(true);
        expect(authService.isInstructorSync()).toBe(true);

        authService._user = { email: 'mahmoudabdelrauf84@gmail.com' };
        expect(authService.isAdminSync()).toBe(true);
        expect(authService.isInstructorSync()).toBe(true);
    });
});
