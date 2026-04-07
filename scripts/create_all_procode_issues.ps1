$ErrorActionPreference = "Stop"

function Create-Issue {
    param(
        [string]$Title,
        [string]$Body,
        [string]$Labels
    )
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempFile -Value $Body -Encoding UTF8
    
    Write-Host "Creating Issue: $Title"
    gh issue create --title $Title --body-file $tempFile --label $Labels
    
    Remove-Item -Path $tempFile -Force
}

# 1. Architecture Refactoring & React Migration
$body1 = @"
### Description
The current platform relies on a monolithic `app.js` (+4600 lines) with Vanilla JS string-literal rendering. This is dangerous (XSS vulnerabilities), unscalable, and very hard to maintain for a rapidly growing system with state.

### Expected Behavior
- The codebase should be fully modular.
- UI elements shouldn't be re-rendered via `innerHTML` strings.

### Suggested Solution
1. **Migrate to Next.js or Vite + React.**
2. Break down `app.js` into modular React components (e.g., `<CourseCard />`, `<VideoPlayer />`).
3. Migrate global state variables (`coursesData`, `lessonsData`) to a Central State Manager (Zustand or Redux).

### Labels
refactor, architecture, priority-high
"@
Create-Issue -Title "[Refactor] Migrate Platform to React / Next.js for Scalability" -Body $body1 -Labels "enhancement"

# 2. Real-time Chat System between users
$body2 = @"
### Description
Currently, communication is limited to comment threads inside lessons. An LMS like Udemy needs direct messaging or a global chat to foster community and direct Q&A between student and instructor.

### Requirements
1. Implement a real-time messaging interface (Direct Messages).
2. Use Firestore `onSnapshot` for real-time synchronization.
3. Show online/offline status indicators.
4. Support unread message counts on the navbar.

### Suggested Solution
Create a new `/chat` route or a slide-out drawer containing a 1-on-1 chat interface. Store messages inside a `/conversations` root collection in Firestore.
"@
Create-Issue -Title "[Feature] Real-time User-to-User Chat & Mentoring System" -Body $body2 -Labels "enhancement"

# 3. Full Admin Panel (Platform Moderation)
$body3 = @"
### Description
We lack a centralized dashboard for platform owners to control the LMS. We need full administrative rights to manage the ecosystem without diving into the Firebase Console.

### Requirements
1. **User Management:** View, ban, or promote users to Instructors/Admins.
2. **Course Moderation:** Approve or reject courses created by instructors, feature specific courses on the homepage.
3. **Refunds & Disputes:** Handle user complaints and initiate payment reversals (Stripe API).
4. **Global Analytics:** Platform-wide revenue, active users, and growth charts.

### Steps to Reproduce (Current Issue)
Currently, to delete a bad user review or ban a user, an engineer has to manually alter Firestore data.

### Suggested Solution
Create an `/admin` route protected by a Firebase Custom Claim (`admin: true`). Build a dashboard tailored for moderators.
"@
Create-Issue -Title "[Feature] Full Platform Administrator Dashboard" -Body $body3 -Labels "enhancement"

# 4. Instructor Dashboard & Full CRUD
$body4 = @"
### Description
Instructors need a robust dashboard to manage their teaching business. Currently, instructors cannot easily create courses dynamically or view their performance metrics efficiently.

### Requirements
1. **Full CRUD for Courses:** Instructors must be able to Create, Read, Update, and Delete courses, modules, and lessons.
2. **Drafts System:** Courses should be saveable as "Drafts" before hitting "Publish".
3. **Analytics:** View student enrollment counts, course completion rates, and average quiz scores.

### Suggested Solution
Expand the existing Instructor Dashboard. Implement a multi-step "Course Creator Wizard" that posts structured JSON into Firestore's `/courses` collection, and upload videos to Firebase Storage/Cloudinary.
"@
Create-Issue -Title "[Feature] Instructor Dashboard: Advanced CRUD & Content Management" -Body $body4 -Labels "enhancement"

# 5. Persistent Data System & Migration from LocalStorage
$body5 = @"
### Description
Crucial data like lesson progress is heavily reliant on `localStorage`. If a user logs in on a different device (phone vs. laptop), their progress is lost or desynced.

### Expected Behavior
Progress should resume exactly where the user left off, regardless of device.

### Suggested Solution
1. Remove generic reliance on local caching for truth.
2. Use Firestore `/users/{uid}/progress` as the single source of truth.
3. Sync video timestamps (`currentTime`) to the database every 15 seconds.
4. On initialization, hydrate the app state from Firestore, not LocalStorage.

### Technical Notes
Throttle/debounce the database writes to avoid hitting Firebase quota limits.
"@
Create-Issue -Title "[Bug] Broken Data Persistence: Migrate State to Cloud Firestore" -Body $body5 -Labels "bug"

# 6. Global Public Reviews System
$body6 = @"
### Description
Course reviews are currently limited in scope. We need a global, public-facing review system to boost conversion rates and SEO.

### Expected Behavior
- Any visitor should see an aggregate 5-star rating system on the landing page of a course.
- Reviews should be paginated and filterable (e.g., "See 5-star reviews").

### Suggested Solution
Update Firestore structure to use distributed counters for course ratings. Build a dedicated section on the Course Details page showing a review distribution chart alongside written comments from enrolled students only.
"@
Create-Issue -Title "[Feature] Global Public Course Reviews & Ratings Engine" -Body $body6 -Labels "enhancement"

Write-Host "All comprehensive LMS feature issues generated successfully!"
