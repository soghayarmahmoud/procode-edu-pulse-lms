#!/bin/bash
# Create GitHub issues for ProCode EduPulse LMS

# Fail on error
set -e

REPO="soghayarmahmoud/procode-edu-pulse-lms"

echo "Creating issues for $REPO..."

gh issue create --repo "$REPO" --title "🔴 Bug: Initial Load Hang (Infinite Loading Screen)" --body "### Description
The application frequently hangs on the 'Loading ProCode EduPulse...' screen. This is primarily caused by sequential, blocking Firestore calls in 'loadData()' and permission errors in 'getCourseReviews'.

### Proposed Fix
Parallelize Firestore fetches, implement timeouts, and move non-essential sync logic to a background task." --label "bug,critical"

gh issue create --repo "$REPO" --title "🔴 Security: Firestore Permission Denial on Course Reviews" --body "### Description
'Missing or insufficient permissions' errors for 'course_reviews' collection are logged in the console.

### Proposed Fix
Update Firestore Security Rules to allow read access to course reviews." --label "security,bug"

gh issue create --repo "$REPO" --title "🟡 UI: Profile Activity Chart Rendering Bug" --body "### Description
The 'Lessons per Week' chart remains empty even when activity data is present. Labels render correctly, but data bars are hidden.

### Proposed Fix
Debug 'storage.getActivityLast7Days()' mapping and ensure the CSS for '.css-bar' correctly handles the height property transition." --label "bug,ui"

gh issue create --repo "$REPO" --title "🟡 Polish: Missing Course Banner Thumbnails" --body "### Description
Courses like 'CSS Essentials' and 'JavaScript Basics' are missing thumbnails, leading to inconsistent UI.

### Proposed Fix
Add high-quality placeholder images or verify the existence of all paths in 'courses.json'." --label "enhancement,ui"

gh issue create --repo "$REPO" --title "🟢 Feature: Dynamic Breadcrumbs for Lessons" --body "### Description
Breadcrumbs on lesson pages are currently static or partially hardcoded.

### Proposed Enhancement
Implement a robust dynamic breadcrumb component that reflects the actual roadmap/module path taken by the user." --label "enhancement"

gh issue create --repo "$REPO" --title "🟢 Performance: Search Optimization (Fuzzy Matching)" --body "### Description
Global search (Ctrl+K) is currently purely client-side and rudimentary.

### Proposed Enhancement
Improve search ranking, add fuzzy matching, and optimize for larger datasets." --label "performance,enhancement"

echo "All issues created successfully."
