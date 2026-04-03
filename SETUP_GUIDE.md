# ProCode Admin & Instructor Dashboard Setup Guide

This document outlines all the necessary Firebase and Cloudinary configuration required for the expanded Admin Control Core and Advanced Instructor Dashboard features.

---

## Table of Contents

1. [Firebase Setup](##firebase-setup)
   - Firestore Database Collections
   - Security Rules
   - Storage Configuration

2. [Cloudinary Setup](#cloudinary-setup)
   - Video Hosting & Streaming
   - Upload Presets & Validations

3. [Implementation Checklist](#implementation-checklist)

4. [Troubleshooting Guide](#troubleshooting-guide)

---

## Firebase Setup

### 1. Firestore Database Collections

The following Firestore collections are **required** for the new functionality:

#### A. **Admin Collections**

##### `admin_settings`
Stores global platform configuration:
```json
{
  "subscriptionPricing": {
    "basic": { "price": 9.99, "features": [" Basic courses", "Community support"] },
    "pro": { "price": 19.99, "features": ["All basic", "Advanced courses", "Priority support"] },
    "premium": { "price": 49.99, "features": ["Everything", "Certificates", "1-on-1 mentoring"] }
  },
  "promotionalBanner": {
    "active": true,
    "text": "50% Off Summer Sale!",
    "color": "#FF6B6B",
    "url": "https://..."
  },
  "maintenanceMode": false,
  "platformName": "ProCode"
}
```

##### `system/analytics`
Stores real-time platform metrics:
```json
{
  "totalUsers": 1250,
  "activeUsers": 890,
  "instructors": 45,
  "totalCourses": 120,
  "totalEnrollments": 3456,
  "totalRevenue": 45678.90,
  "platformGrowth": {
    "newUsersThisMonth": 125,
    "enrollmentGrowthRate": 12.5
  },
  "updatedAt": "timestamp"
}
```

##### `transactions`
Records all revenue transactions:
```json
{
  "transactionId": "txn_1234567890",
  "instructorId": "user_xyz",
  "studentId": "student_abc",
  "courseId": "course_123",
  "amount": 49.99,
  "currency": "USD",
  "type": "course_purchase",
  "status": "completed",
  "description": "Purchase of Advanced React Course",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### B. **Moderation Collections**

##### `moderation_queue`
Tracks flagged content for review:
```json
{
  "flagId": "flag_1234567890",
  "courseId": "course_123",
  "reviewId": "review_456",
  "reason": "Contains offensive language",
  "status": "pending", // pending, approved, removed
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "approvedAt": "timestamp"
}
```

##### `course_reviews/{courseId}/reviews`
Sub-collection for course reviews:
```json
{
  "reviewId": "review_123",
  "userId": "user_xyz",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "rating": 5,
  "text": "Amazing course!",
  "replies": [
    {
      "id": "reply_1",
      "authorId": "instructor_xyz",
      "authorName": "Jane Instructor",
      "text": "Thank you for the feedback!",
      "createdAt": "timestamp"
    }
  ],
  "status": "approved", // pending, approved, flagged
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### C. **Content Management Collections**

##### `courses`
Enhanced course documents (additional fields):
```json
{
  "courseId": "course_123",
  "instructorId": "user_xyz",
  "title": "Advanced React",
  "status": "approved", // draft, pending, approved, rejected
  "description": "Learn React advanced patterns",
  "thumbnail": "cloudinary_url",
  "lessons": [
    {
      "id": "lesson_1",
      "title": "Hooks Intro",
      "videoUrl": "cloudinary_video_url",
      "duration": "15:30",
      "order": 1,
      "createdAt": "timestamp"
    }
  ],
  "resources": [
    {
      "id": "res_1",
      "title": "Class Notes",
      "url": "https://...",
      "type": "pdf",
      "addedAt": "timestamp"
    }
  ],
  "quizzes": ["quiz_id_1", "quiz_id_2"],
  "totalEnrollments": 145,
  "averageRating": 4.8,
  "totalReviews": 42,
  "submittedAt": "timestamp",
  "approvedAt": "timestamp",
  "rejectionReason": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### D. **Announcements**

##### `announcements`
Platform-wide announcements:
```json
{
  "announcementId": "ann_1234567890",
  "title": "Platform Maintenance",
  "text": "ProCode will be down for maintenance on Sunday...",
  "type": "info", // info, warning, success, error
  "active": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 2. Firestore Security Rules

Apply these security rules to protect admin and instructor data:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Admin settings (admins only)
    match /system/{document=**} {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Transactions (logged-in users)
    match /transactions/{transaction} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (resource.data.studentId == request.auth.uid || resource.data.instructorId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Courses
    match /courses/{course} {
      allow read: if resource.data.status == 'approved';
      allow create: if request.auth != null && request.auth.uid == request.resource.data.instructorId;
      allow update: if request.auth != null && (request.auth.uid == resource.data.instructorId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Course reviews
    match /course_reviews/{courseId}/reviews/{review} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Moderation queue (admins only)
    match /moderation_queue/{flag} {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Announcements (public read, admin write)
    match /announcements/{announcement} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### 3. Firebase Storage

**Recommended Folder Structure:**

```
gs://procode-bucket/
├── courses/
│   ├── {courseId}/
│   │   ├── thumbnail.jpg
│   │   ├── videos/
│   │   │   ├── lesson_1.mp4
│   │   │   ├── lesson_2.mp4
│   │   ├── resources/
│   │   │   ├── notes.pdf
├── user-profiles/
│   ├── {userId}/
│   │   ├── avatar.jpg
```

**Storage Rules:**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /courses/{courseId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /user-profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## Cloudinary Setup

### 1. Create a Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard → Settings → API Keys
3. Note your:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (keep this server-side only!)

### 2. Upload Presets Configuration

Cloudinary Upload Presets allow secure uploads without exposing your API Secret to the client.

#### Create Preset for Course Videos:

1. Go to **Settings → Upload**
2. Click **Add upload preset**
3. Configure as follows:

**Basic Settings:**
- **Preset Name:** `procode_course_videos`
- **Signing Mode:** Unsigned (for client-side uploads)
- **Type:** Authenticated (optional but recommended)

**Upload Restrictions:**
```
Allowed file types: Video (mp4, mov, avi, mkv, webm)
Max file size: 500 MB
Max files: 1000
```

**Allowed transformations:**
```
- Default video transformations
- Allow width/height scaling
- Allow quality optimization
```

**Folder Path:**
```
folder: /courses/videos/
```

**Notifications:**
- Webhook URL: `https://your-backend.example.com/webhooks/cloudinary`

#### Create Preset for Course Thumbnails:

1. **Preset Name:** `procode_course_thumbnails`
2. **Accept file types:** Images only (jpg, png, gif)
3. **Max file size:** 5 MB
4. **Folder:** `/courses/thumbnails/`

### 3. Environment Configuration

Create `.env` file in root directory:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_VIDEO_PRESET=procode_course_videos
VITE_CLOUDINARY_THUMBNAIL_PRESET=procode_course_thumbnails
VITE_CLOUDINARY_API_KEY=your_public_api_key

# Firebase Configuration (already present)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```

Update `js/config/env.js`:

```javascript
export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_default_cloud_name',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET || 'procode_course_videos',
    thumbnailPreset: import.meta.env.VITE_CLOUDINARY_THUMBNAIL_PRESET || 'procode_course_thumbnails',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
};
```

### 4. Video Transformation URLs

Use Cloudinary transformations for optimized delivery:

```javascript
// Generate thumbnail from video at 1 second mark
https://res.cloudinary.com/{cloud_name}/video/upload/w_320,h_180,c_fill,so_1,q_90/v1234567890/courses/videos/lesson.mp4

// Adaptive quality (auto selects best quality based on connection)
https://res.cloudinary.com/{cloud_name}/video/upload/q_auto/v1234567890/courses/videos/lesson.mp4

// Responsive video URL
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,c_scale/v1234567890/courses/videos/lesson.mp4
```

### 5. Video Upload via API (Server-Side)

For server-side uploads (e.g., batch imports), use signed requests:

```javascript
// Node.js backend example
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.VITE_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadVideo(filePath, courseId) {
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: `courses/videos/${courseId}`,
        public_id: `lesson_${Date.now()}`,
        eager: [
            { width: 320, height: 180, crop: 'fill', resource_type: 'video', format: 'jpg' }
        ]
    });
    return result;
}
```

---

## Implementation Checklist

### Firebase Setup

- [ ] Create Firestore Database in Production mode
- [ ] Create collections:
  - [ ] `users`
  - [ ] `courses`
  - [ ] `course_reviews`
  - [ ] `transactions`
  - [ ] `moderation_queue`
  - [ ] `announcements`
  - [ ] `system` (with `settings` and `analytics` documents)
- [ ] Apply Firestore Security Rules
- [ ] Configure Firebase Storage bucket
- [ ] Apply Storage Security Rules
- [ ] Enable Firebase Analytics (optional)
- [ ] Configure Firebase Functions for webhooks (optional)

### Cloudinary Setup

- [ ] Create Cloudinary account
- [ ] Note Cloud Name, API Key, API Secret
- [ ] Create upload preset: `procode_course_videos`
- [ ] Create upload preset: `procode_course_thumbnails`
- [ ] Configure upload restrictions and folder paths
- [ ] Add webhook URL (if using backend)
- [ ] Update `.env` file with credentials
- [ ] Test video upload functionality

### Application Configuration

- [ ] Update `js/config/env.js` with Cloudinary config
- [ ] Verify Admin Dashboard loads all sections
- [ ] Verify Instructor Dashboard revenue tracking works
- [ ] Test course moderation flow
- [ ] Test system settings updates
- [ ] Test video uploads in instructor dashboard

---

## Troubleshooting Guide

### Firebase Issues

**Q: "Permission denied" error when accessing collections**
- A: Check Firestore Security Rules. Verify user has `isAdmin` field in profile, or adjust rules to match your use case.

**Q: Collections are empty after creating users**
- A: Ensure `saveUserProfile()` is called in `auth-service.js` after signup.

**Q: Transactions not updating revenue totals**
- A: Verify `recordTransaction()` in `admin-management-service.js` is updating `system/analytics`.

### Cloudinary Issues

**Q: Video uploads fail with "authentication error"**
- A: Verify `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_VIDEO_PRESET` in `.env` are correct.

**Q: Upload widget doesn't appear**
- A: Ensure Cloudinary upload widget script loads. Check browser console for errors. Verify internet connection.

**Q: Video plays but no thumbnail**
- A: Use Cloudinary transformation URL `so_1` parameter to extract thumbnail at specific timestamp.

**Q: Max file size exceeded error**
- A: Check upload preset settings. Default is 500 MB. For larger files, configure on Cloudinary dashboard.

### Application Issues

**Q: Admin dashboard tabs don't switch**
- A: Verify `_initBuilderTabs()` is called in constructor.

**Q: Revenue not showing in instructor dashboard**
- A: Ensure `instructorService.getEarningsSummary()` has permission to read `transactions` collection.

**Q: Course approval not updating status**
- A: Verify Firestore security rules allow course status updates by admins.

---

## Additional Resources

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Video Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Cloudinary Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery)

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review Firebase Console logs
3. Check Cloudinary Dashboard → Usage/Logs
4. Review browser console for JavaScript errors
