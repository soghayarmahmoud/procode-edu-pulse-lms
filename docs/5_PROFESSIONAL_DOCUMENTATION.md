# ProCode EduPulse - Professional API & Technical Documentation

## 📋 Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [REST Endpoints](#rest-endpoints)
4. [Error Handling](#error-handling)
5. [Data Models](#data-models)
6. [Rate Limiting](#rate-limiting)
7. [Security](#security)
8. [Best Practices](#best-practices)
9. [Integration Examples](#integration-examples)

---

## API Overview

### Base URL
```
Production: https://api.procode-edupulse.com/v1
Development: http://localhost:5000/v1
```

### API Version
Current Version: **v1**

### Response Format
All responses are JSON:
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2026-04-17T10:30:00.000Z"
}
```

### Supported Media Types
- `application/json`
- `multipart/form-data` (for file uploads)

---

## Authentication

### Authentication Methods

#### 1. Firebase ID Token (Recommended)
```bash
# Request header
Authorization: Bearer <Firebase_ID_Token>
```

**Getting Token** (Frontend):
```javascript
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const auth = getAuth();
const idToken = await auth.currentUser.getIdToken();

// Use in API call
fetch('/api/v1/courses', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

#### 2. API Key (Development Only)
```bash
Authorization: ApiKey <your-api-key>
X-Api-Key: <your-api-key>
```

#### 3. OAuth Tokens
```bash
Authorization: Bearer <oauth-token>
X-Provider: google|github
```

### Token Expiration
- Firebase ID Tokens: 1 hour
- Refresh Token: Auto-refreshed by SDK
- API Keys: No expiration (revoke manually)

---

## REST Endpoints

### Courses

#### Get All Courses
```http
GET /api/v1/courses
```

**Query Parameters:**
```
?page=1
&limit=10
&sortBy=createdAt
&order=desc
&difficulty=beginner
&tags=javascript,web
&search=React
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_001",
        "title": "JavaScript Fundamentals",
        "description": "Learn JavaScript basics",
        "instructorId": "user_123",
        "thumbnail": "https://...",
        "difficulty": "beginner",
        "rating": 4.8,
        "studentCount": 1250,
        "lessonCount": 15,
        "duration": 120,
        "tags": ["javascript", "web"],
        "createdAt": "2026-01-15T10:00:00Z",
        "isPublished": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "hasMore": true
    }
  }
}
```

#### Get Single Course
```http
GET /api/v1/courses/{courseId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course_001",
    "title": "JavaScript Fundamentals",
    "description": "...",
    "lessons": [
      {
        "id": "lesson_001",
        "title": "Variables & Data Types",
        "order": 1,
        "challenges": ["challenge_001"]
      }
    ],
    "instructor": {
      "id": "user_123",
      "name": "John Doe",
      "avatar": "https://...",
      "bio": "..."
    },
    "reviews": [
      {
        "userId": "user_456",
        "rating": 5,
        "comment": "Great course!",
        "timestamp": "2026-04-10T10:00:00Z"
      }
    ]
  }
}
```

#### Create Course (Instructor Only)
```http
POST /api/v1/courses
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "React Advanced",
  "description": "Master React hooks and patterns",
  "thumbnail": "https://...",
  "difficulty": "advanced",
  "duration": 180,
  "tags": ["react", "advanced", "web"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course_002",
    "title": "React Advanced",
    "createdAt": "2026-04-17T10:00:00Z"
  }
}
```

#### Update Course
```http
PUT /api/v1/courses/{courseId}
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Course
```http
DELETE /api/v1/courses/{courseId}
Authorization: Bearer <token>
```

---

### Lessons

#### Get Course Lessons
```http
GET /api/v1/courses/{courseId}/lessons
```

#### Get Single Lesson
```http
GET /api/v1/lessons/{lessonId}
```

#### Create Lesson
```http
POST /api/v1/courses/{courseId}/lessons
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Functions in JavaScript",
  "content": "# Markdown content here",
  "videoUrl": "https://...",
  "order": 2,
  "duration": 45
}
```

---

### Submissions

#### Submit Code
```http
POST /api/v1/submissions
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "challengeId": "challenge_001",
  "courseId": "course_001",
  "language": "javascript",
  "code": "function hello() { return 'world'; }"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "submission_001",
    "passed": true,
    "output": "All tests passed! ✓",
    "score": 100,
    "executionTime": "125ms",
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

#### Get User Submissions
```http
GET /api/v1/submissions?userId={userId}&courseId={courseId}
Authorization: Bearer <token>
```

#### Get Submission Details
```http
GET /api/v1/submissions/{submissionId}
Authorization: Bearer <token>
```

---

### Payments

#### Create Checkout Session
```http
POST /api/v1/payments/checkout
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "priceId": "price_123",
  "courseId": "course_001",
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_123456",
    "url": "https://checkout.stripe.com/pay/cs_123456"
  }
}
```

#### Get Invoices
```http
GET /api/v1/payments/invoices
Authorization: Bearer <token>
```

#### Get Payment History
```http
GET /api/v1/payments/history?limit=10
Authorization: Bearer <token>
```

---

### Users

#### Get User Profile
```http
GET /api/v1/users/{userId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "avatar": "https://...",
    "role": "student",
    "bio": "...",
    "createdAt": "2026-01-01T00:00:00Z",
    "stats": {
      "coursesEnrolled": 5,
      "coursesCompleted": 2,
      "certificatesEarned": 2,
      "totalXP": 5240
    }
  }
}
```

#### Update Profile
```http
PUT /api/v1/users/{userId}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "displayName": "Jane Doe",
  "bio": "Web developer",
  "avatar": "https://..."
}
```

#### Get User Progress
```http
GET /api/v1/users/{userId}/progress
Authorization: Bearer <token>
```

---

### Analytics

#### Get Course Analytics (Instructor)
```http
GET /api/v1/courses/{courseId}/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
```
?period=week|month|year
&metric=enrollments|completions|timeSpent
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "enrollments": 42,
    "completions": 15,
    "averageScore": 82.5,
    "timeSpent": 1250,
    "dailyData": [
      { "date": "2026-04-17", "value": 6 }
    ]
  }
}
```

#### Get Personal Progress
```http
GET /api/v1/users/{userId}/analytics
Authorization: Bearer <token>
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "type": "format"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

### Error Codes

```
AUTH_REQUIRED          - Authentication required
INVALID_TOKEN          - Token invalid or expired
PERMISSION_DENIED      - Insufficient permissions
INVALID_INPUT          - Invalid request parameters
NOT_FOUND              - Resource not found
CONFLICT               - Resource already exists
RATE_LIMIT_EXCEEDED    - Too many requests
INTERNAL_ERROR         - Server error
EXTERNAL_API_ERROR     - Third-party API error
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/v1/courses', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Error: ${error.error.code} - ${error.error.message}`);
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Data Models

### User Model
```typescript
interface User {
  id: string;                          // Firebase UID
  email: string;                       // Email address
  displayName: string;                 // Display name
  avatar?: string;                     // Avatar URL
  bio?: string;                        // User bio
  role: 'student' | 'instructor' | 'admin';
  createdAt: Timestamp;               // Creation timestamp
  updatedAt: Timestamp;               // Last update
  preferences: {
    theme: 'light' | 'dark';          // Theme preference
    language: string;                 // Language preference
    notifications: boolean;           // Notifications enabled
  };
  stats?: {
    coursesEnrolled: number;
    coursesCompleted: number;
    certificatesEarned: number;
    totalXP: number;
  };
}
```

### Course Model
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  thumbnail?: string;
  videoUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;                   // in minutes
  tags: string[];
  lessons: string[];                  // Lesson IDs
  prerequisites?: string[];           // Course IDs
  rating: number;                     // 0-5
  studentCount: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    category: string;
    subcategory: string;
    maxStudents?: number;
  };
}
```

### Lesson Model
```typescript
interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;                    // Markdown
  videoUrl?: string;
  order: number;
  duration: number;                   // in minutes
  challenges: string[];               // Challenge IDs
  attachments?: Array<{ name: string; url: string }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Submission Model
```typescript
interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  courseId: string;
  language: string;
  code: string;
  output?: string;
  passed: boolean;
  score: number;
  feedback?: string;
  executionTime: number;              // in milliseconds
  timestamp: Timestamp;
  testResults?: Array<{
    testId: string;
    passed: boolean;
    output: string;
  }>;
}
```

---

## Rate Limiting

### Rate Limits
```
Authenticated Users:    1000 requests/hour
Anonymous Users:        100 requests/hour
API Key Users:          10000 requests/hour
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1682016000
```

### Handling Rate Limits
```javascript
fetch(url, options).then(response => {
  const limit = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  }
});
```

---

## Security

### Best Practices

#### 1. API Key Management
```javascript
// ❌ WRONG - Exposing keys
const API_KEY = 'sk_live_12345';

// ✓ CORRECT - Using environment variables
const API_KEY = process.env.API_KEY;

// ✓ CORRECT - Using Firebase ID tokens (frontend)
const idToken = await auth.currentUser.getIdToken();
```

#### 2. Data Validation
```javascript
// Validate all inputs
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Sanitize inputs
const sanitized = DOMPurify.sanitize(userInput);
```

#### 3. HTTPS Only
```javascript
// Always use HTTPS in production
const API_BASE_URL = 'https://api.procode-edupulse.com';

// Never use HTTP
// const API_BASE_URL = 'http://api.procode-edupulse.com'; // ❌
```

#### 4. CORS Configuration
```javascript
// Backend
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Best Practices

### 1. Pagination
```http
GET /api/v1/courses?page=1&limit=20
```

### 2. Sorting
```http
GET /api/v1/courses?sortBy=createdAt&order=desc
```

### 3. Filtering
```http
GET /api/v1/courses?difficulty=beginner&tags=javascript
```

### 4. Caching
```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key, fetcher) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 5. Error Handling
```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        await response.json()
      );
    }

    return response.json();
  } catch (error) {
    logger.error('API call failed', { url, error });
    throw error;
  }
}
```

---

## Integration Examples

### JavaScript/Frontend
```javascript
import { getAuth } from 'firebase/auth';

async function enrollCourse(courseId) {
  const auth = getAuth();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch(
    `/api/v1/courses/${courseId}/enroll`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

### Node.js/Backend
```javascript
const admin = require('firebase-admin');

async function createUserProfile(uid, email) {
  const db = admin.firestore();
  
  await db.collection('users').doc(uid).set({
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: 'student'
  });
}
```

### cURL
```bash
# Get courses
curl -X GET https://api.procode-edupulse.com/v1/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Submit code
curl -X POST https://api.procode-edupulse.com/v1/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "challenge_001",
    "code": "console.log(\"hello\")"
  }'
```

---

**API Version**: 1.0  
**Last Updated**: 2026-04-17  
**Status**: UNDER DEVELOPMENT  
**Support**: support@procode-edupulse.com
