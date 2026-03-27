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

# 1. Progression Math Bug
$body1 = @"
### Description
Currently, course progression percentages are calculated using a hardcoded `"totalLessons`" integer property on the course object. When an instructor uses the CMS to dynamically add a new lesson to a course, the `"totalLessons`" count does not update globally, resulting in progression extending beyond 100% (e.g., 11/10 lessons = 110%).

### Why it matters
A reliable LMS must accurately report progress to students. Going over 100% causes visual UI bugs and misrepresents completion status.

### Steps to fix (Beginner Friendly!)
1. Open `js/services/storage.js` and `js/app.js`.
2. Locate the logic calculating the completion percentage: `percent = completed / course.totalLessons`.
3. Instead of using `course.totalLessons`, dynamically calculate the denominator by filtering the loaded lessons: `lessonsData.filter(l => l.courseId === course.id).length`.
4. Test by completing a dynamically added lesson to ensure the bar caps perfectly at 100%.

### Skills needed
- Basic JavaScript (Array filtering)
- Understanding of state calculation
"@
Create-Issue -Title "[Bug] Course progression calculation fails for dynamically added lessons" -Body $body1 -Labels "bug,good first issue"

# 2. Challenge Builder UI
$body2 = @"
### Description
The new Instructor Dashboard CMS is fantastic, but it is currently missing a tab to create Coding Challenges. Instructors need a way to build coding exercises without diving into the codebase.

### Requirements
Add a third tab in the CMS (alongside Course and Lesson) named **Create Challenge**.
The form should collect:
- Attached Course/Module ID
- Challenge Title & Instructions (Markdown)
- Language (HTML/CSS/JS or Python)
- Starter Code
- Validation/Test Code (Regex for frontend, Assertions for backend)

### Steps to implement
1. Open `js/components/instructor-dashboard.js`.
2. Clone the HTML structure of the Lesson Builder tab.
3. Update the IDs and input fields to match Challenge metadata.
4. Hook the submit button to a new `saveDynamicChallenge(challengeData)` method in `firestore-service.js`.

### Skills needed
- HTML/CSS Form building
- JavaScript asynchronous functions
"@
Create-Issue -Title "[Feature] Add Challenge Builder UI to Instructor CMS" -Body $body2 -Labels "enhancement,good first issue"

# 3. CMS Manage Content
$body3 = @"
### Description
Instructors can currently *create* courses and lessons via the dashboard, but if they make a typo or want to remove outdated content, there is no way to *edit* or *delete* it.

### Feature Request
We need a "Manage Content" section inside the Instructor CMS that lists all dynamic courses and lessons currently saved in Firebase.

### Steps to implement
1. Open `js/components/instructor-dashboard.js`.
2. On initialization, fetch existing dynamic courses (`firestoreService.getDynamicCourses()`).
3. Render a clean table or list view beneath the creation forms.
4. Add "Edit" and "Delete" actions strictly tied to Firestore document IDs.
5. Create `deleteDynamicCourse(id)` in `firestore-service.js`.

### Skills needed
- DOM Manipulation
- Firebase CRUD basics
"@
Create-Issue -Title "[Feature] CMS \`"Manage Content\`" View (Edit/Delete)" -Body $body3 -Labels "enhancement,good first issue"

# 4. RBAC Security
$body4 = @"
### Description
Under the current routing mechanism, any signed-in user can visit `#/instructor-dashboard` by manually typing the URL. While Firestore rules might secure the backend, the frontend UI should gracefully prevent unauthorized access.

### The Fix
Implement Role-Based Access Control (RBAC) to explicitly block standard students.

### Instructions for Contributors
1. In `js/services/auth-service.js`, the `getCurrentUser()` method returns a Firebase auth object. 
2. Ensure the user profile fetched from Firestore has an `isAdmin` or `isInstructor` boolean flag.
3. In `app.js`, within `renderInstructorDashboard()`, add an interceptor: If the local storage profile isn't an admin, redirect them immediately: `window.location.hash = '/'; showToast('Unauthorized');`

### Skills needed
- JavaScript Routing Logic
- Application Security basics
"@
Create-Issue -Title "[Security] Implement UI RBAC for the Instructor Dashboard" -Body $body4 -Labels "enhancement,good first issue"

# 5. Real-time Notifications
$body5 = @"
### Description
When a student requests a "Code Review" on a challenge, and an instructor replies, the student currently has no way of knowing unless they continuously refresh the page and check the specific challenge thread.

### Feature Request
Implement a Notification Bell in the global Navbar that pulses when a user receives a reply on a thread they authored.

### Steps to implement
1. In `discussion-service.js`, whenever `addReply()` is called, get the thread's original `authorId`.
2. If `authorId !== current user`, write a document to a new `/users/{authorId}/notifications` subcollection.
3. In `navbar.js`, subscribe to this notifications collection (`onSnapshot`) and display an unread count badge on the bell icon.

### Skills needed
- Firebase real-time listeners (`onSnapshot`)
- Creating interactive UI badges
"@
Create-Issue -Title "[Feature] Real-time notification bell for Code Review replies" -Body $body5 -Labels "enhancement,good first issue"

# 6. Markdown Live Preview
$body6 = @"
### Description
Instructors currently have to write raw Markdown in the CMS textareas for Lesson Notes and Challenge Instructions, but there is no way for them to see what it will look like once published until they actually hit save.

### The Enhancement
Implement a live Markdown toggle or a split-pane preview next to the textareas in `instructor-dashboard.js`.

### Steps
1. Locate the `<textarea id="lesson-content">` inside `instructor-dashboard.js`.
2. Add a `<div id="lesson-content-preview">` container next to it.
3. Bind an `input` event listener to the textarea that parses the markdown using our existing utility/library and injects the raw HTML into the preview pane.

### Skills needed
- Event listeners (`input`, `keyup`)
- Markdown parsing
"@
Create-Issue -Title "[UI] Add Markdown Live Preview to CMS Builders" -Body $body6 -Labels "enhancement,good first issue"

# 7. Image Upload
$body7 = @"
### Description
When building a new course, instructors are asked for a `thumbnail` URL. Most users do not have public image hosting available. They should be able to upload a local `.jpg` or `.png` directly.

### Goal
Integrate Firebase Cloud Storage into the CMS form.

### Steps
1. Add an `<input type="file" accept="image/*">` to the `instructor-dashboard.js` Course Builder.
2. Extend `firebase-config.js` to initialize Firebase Storage (`getStorage()`).
3. Add an `uploadImage(file)` method to `firestore-service.js` that uploads the file to `/thumbnails/{courseId}` and returns the public download URL.
4. Pass this URL into the `thumbnail` field of the saved course.

### Skills needed
- File Inputs and Web APIs
- Firebase Cloud Storage
"@
Create-Issue -Title "[Feature] Image Thumbnail Upload via Firebase Storage" -Body $body7 -Labels "enhancement,good first issue"

# 8. CMS Dropdown UI
$body8 = @"
### Description
In the Lesson Builder tab, instructors must select which Course the lesson belongs to from a standard HTML `<select>` dropdown. If the platform scales to 50+ courses, scrolling through a standard `<select>` will become terrible UX.

### Solution
Convert the Course Selection dropdown to a searchable, custom select component.

### Instructions
1. You can build a custom `div`-controlled dropdown with an embedded search input, or integrate a lightweight library like Choices.js.
2. Replace the `<select id="lesson-course-id">` in `js/components/instructor-dashboard.js`.
3. Ensure the selected value properly passes the `courseId` to the publish event.

### Skills needed
- Advanced UI/UX Implementation
- Form value binding
"@
Create-Issue -Title "[UI] Upgrade Course Select Dropdown to search-enabled component" -Body $body8 -Labels "enhancement,good first issue"

Write-Host "All issues created successfully."
