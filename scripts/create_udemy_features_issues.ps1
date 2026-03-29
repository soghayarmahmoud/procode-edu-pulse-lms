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

# 1. Paid Courses & Tiered Pricing
$body1 = @"
### Description
Currently, all courses are free by default. To build a sustainable LMS, we need to support paid courses with custom pricing tiers.

### Requirements
1. Update `instructor-dashboard.js` form to include a `price` field (numeric).
2. Add a toggle for "Free" vs "Paid" status.
3. Display the price clearly on Course Cards and Details pages.
4. Support for course coupons/discounts in the metadata.

### Why it matters
Monetization is a core feature for any marketplace-style LMS like Udemy.

### Skills needed
- HTML/JS Form handling
- Metadata schema design
"@
Create-Issue -Title "[Feature] Implementation of Paid Courses & Tiered Pricing" -Body $body1 -Labels "enhancement,monetization"

# 2. Stripe Payment Gateway
$body2 = @"
### Description
Integrate a secure payment provider (Stripe) to allow students to purchase paid courses.

### Requirements
1. Create a `checkout-service.js` using Stripe's client-side SDK.
2. Implement a "Buy Now" button on course pages that redirects to Stripe Checkout.
3. Handle webhook success events to record course enrollment in Firestore.
4. Provide a "Payment History" section in the Student Dashboard.

### Skills needed
- External API Integration (Stripe)
- Asynchronous checkout flows
"@
Create-Issue -Title "[Feature] Stripe Payment Gateway Integration" -Body $body2 -Labels "enhancement,priority,monetization"

# 3. Instructor Revenue Dashboard
$body3 = @"
### Description
Instructors need a professional way to track their performance, sales, and total revenue.

### Features
1. A new `Revenue` tab in the Instructor Dashboard.
2. Visual sales charts using Chart.js or D3.
3. List of recent student enrollments and purchase prices.
4. Balance summary and "Request Payout" button.

### Skills needed
- Data Visualization (Chart.js)
- Advanced Firestore queries (Aggregation)
"@
Create-Issue -Title "[Feature] Advanced Instructor Revenue & Sales Analytics Dashboard" -Body $body3 -Labels "enhancement,instructor-cms"

# 4. Content Protection & Rules Hardening
$body4 = @"
### Description
With the introduction of paid content, we must ensure that course materials (videos/challenges) cannot be accessed directly without a valid enrollment.

### Security Plan
1. Update `firestore.rules` to only allow `READ` on lesson content if the user's `uid` exists in the `/enrollments` collection for that specific `courseId`.
2. Implement server-side verification via Cloud Functions to prevent data scraping.
3. Ensure thumbnails and metadata remain public for marketing purposes.

### Skills needed
- Firestore Security Rules
- Cybersecurity basics (Authorization)
"@
Create-Issue -Title "[Security] Hardening Firestore Rules for Paid Content Protection" -Body $body4 -Labels "security,priority"

# 5. Course Ratings & Review Marketplace
$body5 = @"
### Description
Build a social trust system where students can rate courses and leave detailed reviews.

### Requirements
1. Interactive star-rating component (1-5 stars).
2. Review form that only appears once a student completes >20% of a course.
3. Display aggregate ratings and latest 5 reviews on the Course Landing Page.
4. Allow instructors to reply to reviews to address feedback.

### Skills needed
- UI/UX Design (Interactive components)
- Feedback loops
"@
Create-Issue -Title "[Feature] Course Rating & Review Marketplace System" -Body $body5 -Labels "enhancement,social"

# 6. Student Certificates of Achievement
$body6 = @"
### Description
Automatically reward students with a professional certificate upon successful completion (100% progress) of a course.

### Requirements
1. A certificate generation module (PDF or High-res Canvas).
2. Include Course Name, Student Name, Date, and a unique verification ID.
3. Display earned certificates in the Student Portfolio.
4. Implement a Public Verification Link for LinkedIn sharing.

### Skills needed
- PDF Generation or Canvas API
- Branding & Digital Credentials
"@
Create-Issue -Title "[Feature] Automated Certificate Generation on Course Completion" -Body $body6 -Labels "enhancement,engagement"

Write-Host "All advanced feature issues created successfully."
