# ProCode EduPulse - Backend Roadmap for Beginners

## 📋 Table of Contents
1. [Introduction to Backend Architecture](#introduction)
2. [Technology Stack Explained](#tech-stack)
3. [Firebase Setup Guide](#firebase-setup)
4. [Building Your First API](#first-api)
5. [Database Design](#database-design)
6. [Authentication & Security](#auth-security)
7. [Cloud Functions Tutorial](#cloud-functions)
8. [Deployment Guide](#deployment)
9. [Troubleshooting & Best Practices](#troubleshooting)

---

## Introduction to Backend Architecture

### What is a Backend?
The **backend** is the server-side logic that:
- Stores data in databases
- Processes user requests
- Handles authentication
- Manages payments
- Executes sensitive operations

### ProCode Backend Components
```
┌─────────────────────────────────┐
│  Frontend (React/JavaScript)    │
└────────────────┬────────────────┘
                 │
                 ↓ (HTTP/REST API calls)
┌─────────────────────────────────┐
│  Backend Server (Node.js)       │
├─────────────────────────────────┤
│  Routes & Controllers           │
├─────────────────────────────────┤
│  Business Logic Layer           │
├─────────────────────────────────┤
│  Database Layer (Firestore)     │
└─────────────────────────────────┘
                 ↓
┌─────────────────────────────────┐
│  Database (Firestore Cloud)     │
├─────────────────────────────────┤
│  Collections                    │
│  Documents                      │
│  Fields & Data Types            │
└─────────────────────────────────┘
```

### Request-Response Cycle
```
1. User clicks "Submit Code"
2. Frontend sends HTTP POST to /api/code-execute
3. Backend receives request
4. Backend validates input
5. Backend calls Piston API
6. Piston returns execution result
7. Backend stores result in Firestore
8. Backend sends response to frontend
9. Frontend updates UI
```

---

## Technology Stack Explained

### Firebase (Your Backend Provider)
Firebase is a **Backend-as-a-Service (BaaS)** that provides:

#### 1. **Firestore Database**
- NoSQL cloud database
- Real-time sync
- Offline support
- Query capabilities

**Example Structure**:
```
firestore/
├── users/
│   ├── user123/
│   │   ├── email: "john@example.com"
│   │   ├── displayName: "John Doe"
│   │   ├── createdAt: "2026-01-15"
│   │   └── role: "student"
│   └── user456/
├── courses/
│   ├── course001/
│   │   ├── title: "HTML Basics"
│   │   ├── lessons: ["lesson1", "lesson2"]
│   │   └── instructorId: "user123"
│   └── course002/
└── submissions/
    ├── sub001/
    │   ├── userId: "user456"
    │   ├── courseId: "course001"
    │   ├── code: "console.log('hello')"
    │   └── timestamp: 1234567890
```

#### 2. **Firebase Authentication**
- Email/Password auth
- OAuth integration (Google, GitHub)
- Session management
- User management

**Example Flow**:
```javascript
// User signs up
firebase.auth().createUserWithEmailAndPassword(email, password)

// User signs in
firebase.auth().signInWithEmailAndPassword(email, password)

// Get current user
firebase.auth().currentUser

// Sign out
firebase.auth().signOut()
```

#### 3. **Cloud Functions**
- Serverless backend code
- Triggered by events
- No server management
- Auto-scaling

**Example Use Cases**:
```javascript
// Function 1: Handle payment webhook
exports.handleStripeWebhook = functions.https.onRequest(...)

// Function 2: Generate certificate PDF
exports.generateCertificate = functions.firestore
  .document('submissions/{submissionId}')
  .onWrite(async (change, context) => { ... })

// Function 3: Send email on course completion
exports.notifyCompletion = functions.firestore
  .document('progress/{userId}')
  .onUpdate(async (change, context) => { ... })
```

#### 4. **Cloud Storage**
- File storage (images, videos, PDFs)
- CDN delivery
- Access control

---

## Firebase Setup Guide

### Step 1: Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project
firebase init

# Select these options:
# ✓ Firestore Database
# ✓ Cloud Functions
# ✓ Cloud Storage
# ✓ Hosting
```

### Step 2: Configure Firestore

Create `firestore.rules`:
```sql
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Allow anyone to read courses
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.instructorId;
    }

    // Only instructors can access submissions of their courses
    match /submissions/{submissionId} {
      allow read: if request.auth.uid == resource.data.userId 
                  || request.auth.uid == resource.data.instructorId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Admin only
    match /admin_logs/{logId} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### Step 3: Initialize Firebase in Frontend

Create `js/services/firebase-config.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
```

### Step 4: Set Environment Variables

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
```

---

## Building Your First API

### Simple REST API with Cloud Functions

#### Step 1: Create HTTP Function

Create `functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Simple "Hello World" function
export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Firebase!' });
});

// Get user profile
export const getUserProfile = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const userId = context.auth.uid;
  
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    return { success: true, data: userDoc.data() };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Update user profile
export const updateUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const { displayName, bio, avatar } = data;
  const userId = context.auth.uid;

  try {
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        displayName,
        bio,
        avatar,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return { success: true, message: 'Profile updated' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

#### Step 2: Deploy Function

```bash
cd functions
firebase deploy --only functions
```

#### Step 3: Call from Frontend

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase-config.js';

const getUserProfile = httpsCallable(functions, 'getUserProfile');

async function loadProfile() {
  try {
    const result = await getUserProfile();
    console.log('Profile:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

---

## Database Design

### Collections Structure

```
users/
  {userId}/
    - email: string
    - displayName: string
    - avatar: string
    - createdAt: timestamp
    - role: "student" | "instructor" | "admin"
    - bio: string
    - preferences: map
      - theme: "dark" | "light"
      - language: "en" | "es"
      - notifications: boolean

courses/
  {courseId}/
    - title: string
    - description: string
    - instructorId: string
    - thumbnail: string
    - lessons: array of lessonIds
    - tags: array of strings
    - difficulty: "beginner" | "intermediate" | "advanced"
    - createdAt: timestamp
    - updatedAt: timestamp
    - isPublished: boolean
    - studentCount: number
    - rating: number

lessons/
  {lessonId}/
    - courseId: string
    - title: string
    - content: string (markdown)
    - videoUrl: string
    - order: number
    - duration: number (minutes)
    - challenges: array of challengeIds

challenges/
  {challengeId}/
    - lessonId: string
    - title: string
    - description: string
    - testCases: array
    - initialCode: string
    - difficulty: number (1-10)
    - language: "javascript" | "python" | "html" | "css"

submissions/
  {submissionId}/
    - userId: string
    - challengeId: string
    - courseId: string
    - code: string
    - output: string
    - passed: boolean
    - timestamp: timestamp
    - score: number
    - feedback: string

reviews/
  {reviewId}/
    - courseId: string
    - userId: string
    - rating: number (1-5)
    - comment: string
    - timestamp: timestamp
    - helpful: number
```

### Querying Examples

```javascript
// Get all courses by instructor
const coursesByInstructor = await db
  .collection('courses')
  .where('instructorId', '==', userId)
  .get();

// Get recent submissions
const recentSubmissions = await db
  .collection('submissions')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();

// Get course with lessons
const course = await db.collection('courses').doc(courseId).get();
const lessons = await db
  .collection('lessons')
  .where('courseId', '==', courseId)
  .orderBy('order')
  .get();

// Real-time listener
db.collection('users').doc(userId).onSnapshot((snapshot) => {
  console.log('User data:', snapshot.data());
});
```

---

## Authentication & Security

### Implementing User Registration

```javascript
// Frontend
async function registerUser(email, password, displayName) {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      createdAt: serverTimestamp(),
      role: 'student'
    });

    return { success: true, userId: userCredential.user.uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Securing Firestore Rules

```sql
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return request.auth.token.admin == true;
    }

    function isUser(userId) {
      return request.auth.uid == userId;
    }

    // User documents
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isUser(userId);
      allow update: if isUser(userId);
      allow delete: if isAdmin();
    }

    // Admin documents
    match /admin_logs/{document=**} {
      allow read, write: if isAdmin();
    }

    // Payments (sensitive)
    match /payments/{userId}/{document=**} {
      allow read: if isUser(userId) || isAdmin();
      allow write: if false; // Only backend writes
    }
  }
}
```

---

## Cloud Functions Tutorial

### Triggered Functions

#### 1. On User Creation
```typescript
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    await admin.firestore().collection('users').doc(uid).set({
      email,
      displayName: displayName || 'Anonymous',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'student',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });

    console.log(`User profile created for ${uid}`);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});
```

#### 2. On Course Submission
```typescript
export const updateProgressOnSubmission = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data();
    const { userId, courseId, challengeId, passed } = submission;

    try {
      // Update user progress
      const progressRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('progress')
        .doc(courseId);

      const progressDoc = await progressRef.get();
      const completed = passed ? 1 : 0;

      if (progressDoc.exists) {
        await progressRef.update({
          completedChallenges: admin.firestore.FieldValue.increment(completed),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await progressRef.set({
          completedChallenges: completed,
          startedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  });
```

---

## Deployment Guide

### Deploy to Firebase Hosting

```bash
# Initialize hosting
firebase init hosting

# Build your frontend
npm run build

# Deploy
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore
firebase deploy --only firestore
```

### Environment Variables in Cloud Functions

```typescript
// functions/src/index.ts
const API_KEY = process.env.API_KEY || 'default';

export const myFunction = functions.https.onCall(async (data, context) => {
  // Use API_KEY
});
```

Deploy with:
```bash
firebase functions:config:set stripe.key="sk_live_xxxxx"
firebase deploy --only functions
```

---

## Troubleshooting & Best Practices

### Common Issues & Solutions

#### 1. **Permission Denied Error**
```
Error: Permission denied for /users/userId
```

**Solution**: Check Firestore rules
```sql
match /users/{userId} {
  allow read: if request.auth.uid == userId;
}
```

#### 2. **Quota Exceeded**
```
Error: Resource exhausted: Quota exceeded
```

**Solution**: Implement caching and rate limiting
```javascript
const cache = {};

function getCachedData(key, fetcher) {
  if (cache[key] && Date.now() - cache[key].time < 60000) {
    return cache[key].data;
  }
  return fetcher();
}
```

#### 3. **Slow Queries**
**Solution**: Add indexes
```bash
firebase firestore:indexes
```

#### 4. **Large File Uploads**
**Solution**: Use resumable uploads
```javascript
const task = ref(storage, `files/${filename}`);
uploadBytesResumable(task, file, metadata);
```

### Best Practices

1. **Always validate input** on backend
2. **Use transactions** for multi-document updates
3. **Implement rate limiting** for API calls
4. **Use batch operations** for bulk updates
5. **Implement proper error handling**
6. **Add logging** for debugging
7. **Monitor quota usage**
8. **Use connection pooling** for databases
9. **Cache frequently accessed data**
10. **Test thoroughly** before deployment

---

## Next Steps

1. **Setup Firebase Project** (2 hours)
2. **Create Database Schema** (4 hours)
3. **Implement Authentication** (3 hours)
4. **Build Cloud Functions** (8 hours)
5. **Deploy & Test** (2 hours)

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-17  
**Target Audience**: Backend beginners (0-1 year experience)  
**Estimated Learning Time**: 20-30 hours
