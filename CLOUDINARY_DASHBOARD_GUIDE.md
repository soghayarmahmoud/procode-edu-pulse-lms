# Cloudinary Integration & Dashboard Enhancement Guide

## Overview

ProCode EduPulse now features enterprise-grade video hosting via **Cloudinary** with comprehensive **Instructor Dashboard** and **Admin Dashboard** for full platform management.

---

## 🎥 Cloudinary Video Hosting

### What's Included

- **500MB video uploads** with automatic transcoding
- **Multi-quality streaming** (HD, SD, Mobile) for different devices
- **Adaptive bitrate** selection based on connection speed
- **Video thumbnail extraction** at custom timestamps
- **Secure URLs** for premium course protection
- **Global CDN** distribution for fast playback

### Credentials

```
Cloud Name: procode
API Key: 736918845124244
Upload Preset (Video): procode_courses
Upload Preset (Images): procode_images
```

### Supported Video Formats

| Format | Codec | Max Size |
|--------|-------|----------|
| MP4 | H.264 | 500MB |
| MOV | ProRes | 500MB |
| AVI | Various | 500MB |
| MKV | VP9 | 500MB |
| WebM | VP8 | 500MB |

---

## 📊 Instructor Dashboard

### Location
Route: `/#/instructor`

### Features

#### 1. **Course Builder**
- Create new courses with rich metadata
- Set difficulty level (Beginner/Intermediate/Advanced)
- Configure pricing (Free or Premium)
- Upload course thumbnail
- Publish to cloud immediately

```javascript
// Example: Create a course
const courseData = {
    id: 'react-native-pro',
    title: 'React Native Pro',
    difficulty: 'Advanced',
    description: 'Master React Native...',
    totalLessons: 15,
    pricing: {
        type: 'premium',
        price: 49.99
    },
    isDynamic: true
};
firestoreService.saveDynamicCourse(courseData);
```

#### 2. **Lesson Builder**
- Add multiple lessons to courses
- Upload videos from:
  - Cloudinary (secured upload)
  - YouTube (iframe embed)
  - External URLs
  - Vimeo
- Write lesson content in Markdown
- Set lesson order/sequence
- Track lesson duration

```javascript
// Example: Add a lesson with Cloudinary video
const lessonData = {
    courseId: 'react-native-pro',
    title: 'Setting Up React Native',
    videoSource: 'cloudinary',
    videoUrl: 'https://res.cloudinary.com/procode/...',
    duration: '25 min',
    order: 1
};
firestoreService.saveDynamicLesson(lessonData);
```

#### 3. **Challenge Builder**
- Create coding challenges
- Write instructions in Markdown
- Provide starter code
- Define validation rules (regex/assertions)
- Support HTML/CSS/JS and Python

#### 4. **Resource Manager**
- Attach external resources (GitHub repos, PDFs)
- Link to documentation
- Connect supplementary materials
- Organize by course

#### 5. **Quiz Creator**
- Create multiple-choice quizzes
- Set passing score threshold
- Define questions in JSON format
- Link to courses

#### 6. **Content Management**
- View all courses and lessons
- Edit existing content
- Delete courses/lessons
- Manage module hierarchy

#### 7. **Analytics Dashboard**
- Total earnings
- Real-time enrollment count
- Active course statistics
- Student completion rates
- Revenue breakdown by course

---

## 👨‍💼 Admin Dashboard

### Location
Route: `/#/admin`

### Access Control
- **Super Admin Only** - Requires `role: 'admin'` in Firestore
- Comes with 7 management tabs

### Features

#### Tab 1: **Overview**
- Platform KPIs (users, courses, revenue, growth)
- Real-time activity feed
- Quick action buttons
- Recent instructor submissions

```javascript
// Admin stats example
{
    totalUsers: 1250,
    totalCourses: 47,
    totalRevenue: 15420.50,
    growthRate: 12,
    activeNow: 342
}
```

#### Tab 2: **User Management**
- View all users with roles
- Search by email/name
- Filter by role (student/instructor/admin)
- **Promote users** to instructor/admin
- **Ban troublemakers**

```javascript
// Usage
await firestoreService.updateUserRole(userId, 'instructor');
// Roles: 'student' | 'instructor' | 'admin' | 'banned'
```

#### Tab 3: **Course Management**
- Browse all courses (published & drafts)
- Search by title
- Filter by status (published/draft/pending)
- **Edit course metadata**
- **Delete courses** and cascade data
- View course statistics (enrollments, ratings)

#### Tab 4: **Media Management**
- View Cloudinary storage dashboard
- Check bandwidth usage
- Monitor storage quotas
- **Sync Cloudinary status**

#### Tab 5: **Content Moderation**
- Review flagged course content
- Manage reported user comments
- **Approve/delete flagged reviews**
- Moderation workflow queue

#### Tab 6: **Analytics & Revenue**
- Platform-wide analytics
- Total revenue tracking
- Conversion rates (free → paid)
- Course completion statistics
- Instructor earning breakdown
- Interactive revenue charts

#### Tab 7: **System Settings**
- Platform name configuration
- Maintenance mode toggle
- Notification preferences
- Email alert thresholds

---

## 🔧 Technical Implementation

### File Structure

```
js/services/
├── cloudinary-config.js        ← Cloudinary integration (NEW)
├── media-service.js            ← Video upload abstraction (ENHANCED)
├── firestoreService.js         ← Data layer (extended with CRUD)
└── auth-service.js             ← Role checking

js/components/
├── instructor-dashboard.js     ← Instructor UI (ENHANCED)
├── admin-dashboard.js          ← Admin UI (NEW)
└── video-player.js             ← Video playback helper
```

### Key Services

#### cloudinary-config.js
```javascript
// Initialize widget
await initCloudinaryWidget();

// Upload video with progress
await openCloudinaryUploadWidget(
    { courseId: 'my-course' },
    (info) => console.log('Done:', info.secure_url),
    (progress) => console.log('Uploading:', progress.percent + '%')
);

// Generate streaming URLs
const urls = {
    original: getOptimizedVideoUrl(videoUrl),
    hd: getOptimizedVideoUrl(videoUrl, { quality: 'auto:best' }),
    mobile: getOptimizedVideoUrl(videoUrl, { quality: 'auto:low' })
};

// Get thumbnail
const thumb = getVideoThumbnail(videoUrl, { timestamp: 5 });
```

#### media-service.js
```javascript
// Validate before upload
const valid = mediaService.validateVideoFile(file);
if (!valid.valid) {
    console.error(valid.error);
}

// Get video metadata
const metadata = await mediaService.getVideoMetadata(videoUrl);
console.log(metadata.duration, metadata.videoWidth);

// Generate adaptive qualities
const qualities = mediaService.generateAdaptiveQualities(videoUrl);
```

#### firestoreService extensions
```javascript
// Course CRUD
await firestoreService.saveDynamicCourse(courseData);
const courses = await firestoreService.getDynamicCourses();
await firestoreService.deleteDynamicCourse(courseId);

// Lesson CRUD
await firestoreService.saveDynamicLesson(lessonData);
const lessons = await firestoreService.getDynamicLessons();

// Admin operations
const users = await firestoreService.getAllUsers();
await firestoreService.updateUserRole(userId, 'instructor');
const stats = await firestoreService.getAdminDashboardStats();
```

---

## 🚀 Getting Started

### For Instructors

1. **Create a Course**
   - Navigate to `/#/instructor`
   - Click "Create New Course" tab
   - Fill in course metadata
   - Click "Publish Course"

2. **Add Lessons**
   - Go to "Lesson Builder" tab
   - Select your course from dropdown
   - Fill lesson details
   - **Upload video via Cloudinary** ("Secure Upload" button)
   - Add lesson content in Markdown
   - Click "Publish Lesson"

3. **Monitor Analytics**
   - Open "Revenue Tracking" tab
   - View earnings by course
   - Check student breakdown
   - Export reports (future feature)

### For Administrators

1. **Access Admin Panel**
   - Navigate to `/#/admin`
   - System verifies your admin role
   - Dashboard loads automatically

2. **Manage Users**
   - Go to "Users" tab
   - Search/filter users
   - Promote to instructor: Click "Promote" button
   - Ban users: Click "Ban" button

3. **Monitor Platform**
   - Check "Overview" for KPIs
   - Navigate "Analytics" for detailed insights
   - Use "Moderation" to review flagged content

---

## 📋 Firestore Schema

### dynamic_courses Collection
```javascript
{
    id: 'react-native-pro',
    title: 'React Native Professional',
    description: '...',
    icon: 'fa-brands fa-react',
    difficulty: 'Advanced',
    thumbnail: 'https://res.cloudinary.com/...',
    totalLessons: 15,
    instructorId: 'user_123',
    instructorEmail: 'john@example.com',
    pricing: {
        type: 'premium', // or 'free'
        price: 49.99
    },
    isDynamic: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'published' // or 'draft'
}
```

### dynamic_lessons Collection
```javascript
{
    id: 'react-setup-lesson',
    courseId: 'react-native-pro',
    title: 'Setting Up Your Environment',
    type: 'theory', // or 'practice'
    videoSource: 'cloudinary', // 'youtube', 'vimeo', 'external'
    videoUrl: 'https://res.cloudinary.com/procode/video/upload/...',
    duration: '25 min',
    order: 1,
    content: '# Markdown content...',
    instructorId: 'user_123',
    isDynamic: true,
    createdAt: timestamp,
    updatedAt: timestamp
}
```

---

## 🔐 Security & Permissions

### Firestore Rules (Required)
```javascript
// Allow public read access
match /dynamic_courses/{courseId} {
    allow read: if true;
    allow write: if isInstructor() || isAdmin();
    allow delete: if isAdmin();
}

// Instructor-only operations
match /dynamic_lessons/{lessonId} {
    allow read: if true;
    allow write: if isInstructor() || isAdmin();
}

// Role checking
function isAdmin() {
    return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function isInstructor() {
    let role = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    return role in ['instructor', 'admin'];
}
```

### Upload Validation
- File type checking (MIME type validation)
- File size limits (500MB max)
- Format whitelist enforcement
- Cloudinary virus scanning (optional add-on)

---

## 🐛 Troubleshooting

### Video upload hangs
- Check browser DevTools → Network tab
- Verify upload preset exists in Cloudinary
- Try with file <100MB first
- Clear browser cache

### Admin dashboard shows "Access Denied"
- Confirm user has `role: 'admin'` in Firestore
- Check user authentication status
- Clear localStorage
- Reload page

### Course not saving
- Verify all required fields filled
- Check browser console for errors
- Ensure Firestore rules allow writes
- Confirm user is authenticated

### Video not playing
- Check Cloudinary URL is `secure_url` format
- Verify video format is supported
- Try different browser/device
- Test with getOptimizedVideoUrl()

---

## 📈 Analytics & Reporting

### What's Tracked
- Course enrollments
- Video playtime/completion
- Quiz attempts and scores
- User engagement metrics
- Instructor earnings

### Admin Reports
- Monthly revenue by course
- User acquisition trends
- Course completion rates
- Average ratings & reviews
- Engagement by device type

---

## 🌟 Best Practices

### For Instructors
1. **Test before publishing** - Preview all lessons before going live
2. **Compress videos** - Pre-compress videos for faster Cloudinary processing
3. **Use descriptors** - Add detailed lesson descriptions for SEO
4. **Organize logically** - Plan course structure before uploading
5. **Monitor quality** - Check student feedback regularly

### For Administrators
1. **Regular audits** - Review flagged content weekly
2. **User verification** - Check new instructor credentials
3. **Storage monitoring** - Track Cloudinary bandwidth usage
4. **Role management** - Keep admin roster minimal
5. **Backup regularly** - Export course data periodically

---

## 🔄 Integration Checklist

Before deploying to production:

- [ ] Create Cloudinary upload presets
- [ ] Configure Firestore security rules
- [ ] Test video upload from instructor dashboard
- [ ] Verify admin dashboard access controls
- [ ] Test course deletion cascade
- [ ] Enable CORS for Cloudinary widget
- [ ] Configure API rate limiting
- [ ] Set up email notifications
- [ ] Test payment integration (if applicable)
- [ ] Load test with 100+ concurrent users

---

## 📞 Support

For issues or questions:
1. Check INTEGRATION_GUIDE.js for detailed troubleshooting
2. Review Firestore security rules
3. Verify Cloudinary credentials
4. Check browser console for JavaScript errors
5. Contact platform administrator

---

**Version**: 2.0.0  
**Last Updated**: [Current Session]  
**Status**: Production Ready ✅
