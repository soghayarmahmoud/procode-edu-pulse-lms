# Configuration Checklist: Firebase & Cloudinary

This checklist provides a quick reference for all configuration required for the new Admin and Instructor dashboard features.

---

## ✅ Firebase Configuration Required

### Firestore Collections to Create

#### 1. **users** (Existing - Add Fields)
Add these fields to existing user documents:
- `isAdmin: boolean`
- `isInstructor: boolean`
- `status: "active" | "banned" | "suspended"`
- `bannedAt: timestamp | null`
- `bannedReason: string`
- `suspendedUntil: timestamp | null`
- `suspensionReason: string`

#### 2. **transactions** (NEW Collection)
Auto-generate collection with documents:
```
Document ID: txn_{timestamp}
Fields:
- transactionId (string)
- instructorId (string)
- studentId (string)
- courseId (string)
- amount (number)
- currency (string) - default "USD"
- type (string) - "course_purchase", "subscription"
- status (string) - "pending", "completed", "failed"
- description (string)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### 3. **moderation_queue** (NEW Collection)
Auto-generate collection with documents:
```
Document ID: flag_{timestamp}
Fields:
- flagId (string)
- courseId (string)
- reviewId (string)
- reason (string)
- status (string) - "pending", "approved", "removed"
- createdAt (timestamp)
- updatedAt (timestamp)
- approvedAt (timestamp | null)
```

#### 4. **courses** (Existing - Add Fields)
Add these fields to existing course documents:
- `status: "draft" | "pending" | "approved" | "rejected"`
- `instructorId: string`
- `lessons: array` - format: `[{id, title, videoUrl, duration, order, createdAt}]`
- `resources: array` - format: `[{id, title, url, type: "pdf"|"github"|"link", addedAt}]`
- `quizzes: array` - array of quiz IDs
- `totalEnrollments: number`
- `averageRating: number`
- `totalReviews: number`
- `submittedAt: timestamp | null`
- `approvedAt: timestamp | null`
- `rejectedAt: timestamp | null`
- `rejectionReason: string | null`

#### 5. **system/settings** (NEW Document)
Create document at path: `system` → `settings`
```
Document ID: settings
Fields:
{
  "subscriptionPricing": {
    "basic": { "price": 9.99, "features": ["..."] },
    "pro": { "price": 19.99, "features": ["..."] },
    "premium": { "price": 49.99, "features": ["..."] }
  },
  "promotionalBanner": {
    "active": false,
    "text": "",
    "color": "#FF6B6B",
    "url": ""
  },
  "maintenanceMode": false,
  "platformName": "ProCode",
  "updatedAt": "timestamp"
}
```

#### 6. **system/analytics** (NEW Document)
Create document at path: `system` → `analytics`
```
Document ID: analytics
Fields:
{
  "totalUsers": 0,
  "activeUsers": 0,
  "instructors": 0,
  "totalCourses": 0,
  "totalEnrollments": 0,
  "totalRevenue": 0,
  "platformGrowth": {
    "newUsersThisMonth": 0,
    "enrollmentGrowthRate": 0
  },
  "updatedAt": "timestamp"
}
```

#### 7. **announcements** (NEW Collection)
Auto-generate collection with documents:
```
Document ID: ann_{timestamp}
Fields:
{
  "announcementId": "ann_123",
  "title": "Announcement Title",
  "text": "Full announcement text",
  "type": "info | warning | success | error",
  "active": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 8. **course_reviews/{courseId}/reviews** (Existing Sub-collection - Update)
Update review documents to include:
- `replies: array` - format: `[{id, authorId, authorName, text, createdAt}]`
- `status: "pending" | "approved" | "flagged"`

### Firestore Security Rules

**Location:** Firestore Console → Rules

Copy and paste the security rules from [SETUP_GUIDE.md](SETUP_GUIDE.md#2-firestore-security-rules)

Key points:
- Users can only read/write their own profile
- Admins can read/write everything
- Transactions require user authentication
- Courses are publicly readable if approved
- Moderation queue is admin-only

### Firebase Storage Setup

**Folder Structure to Create:**
```
gs://your-bucket/
├── courses/
│   ├── {courseId}/
│   │   ├── thumbnail.jpg
│   │   ├── videos/
│   │   │   ├── lesson_1.mp4
│   │   │   ├── lesson_2.mp4
│   │   ├── resources/
│   │       ├── notes.pdf
├── user-profiles/
    ├── {userId}/
        ├── avatar.jpg
```

**Copy Storage Rules** from [SETUP_GUIDE.md](SETUP_GUIDE.md#storage-rules)

---

## ✅ Cloudinary Configuration Required

### Account Setup

1. **Create Account** at https://cloudinary.com
2. **Navigate to Dashboard**
3. **Note These Values:**
   - Cloud Name: `____________`
   - API Key: `____________`
   - API Secret: `____________` (keep secret!)

### Upload Presets

**Preset 1: prodeprocode_course_videos**

Location: Settings → Upload

Configuration:
- Name: `procode_course_videos`
- Signing Mode: `Unsigned`
- Accepted file types: `All video types`
- Max file size: `500 MB`
- Max files: `1000`
- Public ID prefix: `courses/videos`
- Type: `Authenticated (optional)`

**Preset 2: procode_course_thumbnails**

- Name: `procode_course_thumbnails`
- Signing Mode: `Unsigned`
- Accepted file types: `Images only (jpg, png, gif)`
- Max file size: `5 MB`
- Public ID prefix: `courses/thumbnails`

### Environment Variables

**File:** `.env` (root directory)

```env
# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_VIDEO_PRESET=procode_course_videos
VITE_CLOUDINARY_THUMBNAIL_PRESET=procode_course_thumbnails
VITE_CLOUDINARY_API_KEY=your_public_api_key

# Optional - Server side only (do NOT expose to client)
# CLOUDINARY_API_SECRET=your_api_secret
```

**File:** `js/config/env.js` (update)

```javascript
export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_default_cloud_name',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET || 'procode_course_videos',
    thumbnailPreset: import.meta.env.VITE_CLOUDINARY_THUMBNAIL_PRESET || 'procode_course_thumbnails',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
};
```

### API Endpoints (Optional - for backend)

If using server-side uploads:
- **Upload API:** `https://api.cloudinary.com/v1_1/{cloud_name}/video/upload`
- **Delete API:** `https://api.cloudinary.com/v1_1/{cloud_name}/resources/video/destroy`
- **Transform URL:** `https://res.cloudinary.com/{cloud_name}/video/upload/{transformations}/v{version}/{public_id}`

---

## ✅ Application Code Changes

### Already Implemented ✅

- [x] `js/services/admin-management-service.js` - Created (1000+ lines)
- [x] `js/services/instructor-service.js` - Created (800+ lines)
- [x] `js/services/media-service.js` - Enhanced
- [x] `js/components/admin-dashboard.js` - Updated with 3 new tabs
- [x] `js/components/instructor-dashboard.js` - Updated with 2 new tabs
- [x] `SETUP_GUIDE.md` - Created (complete guide)
- [x] `IMPLEMENTATION_SUMMARY.md` - Created (overview)

### What You Need to Do

1. **Create Firebase Collections** (see above)
2. **Apply Firestore Security Rules** (see above)
3. **Configure Cloudinary** (see above)
4. **Update `.env` file** with credentials
5. **Test Each Feature:**
   - [ ] Admin can access all tabs
   - [ ] User management works
   - [ ] Course approval works
   - [ ] Instructor can upload videos
   - [ ] Revenue tracking displays correctly

---

## 📋 Quick Reference Table

| Feature | Firebase | Cloudinary | Code |
|---------|----------|-----------|------|
| User Banning | ✅ Add fields to `users` | - | ✅ Done |
| Analytics | ✅ Create `system/analytics` | - | ✅ Done |
| Content Moderation | ✅ Create `moderation_queue` | - | ✅ Done |
| Announcements | ✅ Create `announcements` | - | ✅ Done |
| Video Upload | ✅ Update `courses` | ✅ Create preset | ✅ Done |
| Revenue Tracking | ✅ Create `transactions` | - | ✅ Done |
| Course Interactions | ✅ Update `course_reviews` | - | ✅ Done |
| System Settings | ✅ Create `system/settings` | ✅ API credentials | ✅ Done |

---

## 🧪 Testing Checklist

### Firebase
- [ ] Firestore collections created and accessible
- [ ] Security rules applied without errors
- [ ] Can read/write test data
- [ ] Users collection has new fields
- [ ] System collections initialized

### Cloudinary
- [ ] Account created and verified
- [ ] API credentials obtained
- [ ] Upload presets created
- [ ] `.env` file configured
- [ ] Upload widget appears in application

### Application
- [ ] Admin dashboard loads without errors
- [ ] All admin tabs render correctly:
  - [ ] Overview
  - [ ] Analytics & Revenue
  - [ ] Content Moderation
  - [ ] System Settings
- [ ] Instructor dashboard loads
- [ ] New instructor tabs appear:
  - [ ] Course Interactions
  - [ ] Revenue Tracking
- [ ] Video upload widget functional
- [ ] Analytics calculate correctly

---

## 🚨 Common Issues & Solutions

### Firebase Issues

| Issue | Solution |
|-------|----------|
| "Permission denied" | Check security rules in Firebase Console |
| Collections not visible | Refresh Firestore console, wait for sync |
| Can't update analytics | Verify `system` document exists |
| User fields missing | Add fields to existing user documents |

### Cloudinary Issues

| Issue | Solution |
|-------|----------|
| Upload widget not showing | Check `.env` file and `env.js` config |
| "Invalid preset" error | Verify preset names match exactly |
| "Max file size exceeded" | Check upload preset settings (default 500MB) |
| Video won't play | Verify video URL format with transformations |

### Application Issues

| Issue | Solution |
|-------|----------|
| Tabs don't switch | Check `_initBuilderTabs()` is called |
| Revenue shows $0 | Ensure `transactions` collection has data |
| No user data | Verify Firestore rules allow collection access |
| Admin features disabled | Check `isAdmin` field in user profile |

---

## 📞 Support Resources

**Firebase:**
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase Console](https://console.firebase.google.com)

**Cloudinary:**
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Widget Docs](https://cloudinary.com/documentation/upload_widget)
- [Cloudinary Dashboard](https://cloudinary.com/console)

**Project:**
- `SETUP_GUIDE.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Feature overview

---

## ✨ You're All Set!

Once you've completed all checkmarks above, your ProCode platform will have:

✅ **Complete Admin Control Core**
✅ **Advanced Instructor Dashboard**
✅ **Video Content Support**
✅ **Revenue Tracking**
✅ **Content Moderation**
✅ **System Configuration**

**Start implementing today! 🚀**
