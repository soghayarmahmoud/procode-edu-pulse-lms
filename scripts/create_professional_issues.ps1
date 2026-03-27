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

# 1. Monetization & Payment Infrastructure
$body1 = @"
### 🎯 Objective
Transform ProCode EduPulse from a free resource into a sustainable professional LMS by enabling "Paid" courses and integrating a secure payment gateway.

### ✨ Key Features
- **CMS Integration**: Add `isPaid` and `price` fields to the Course Builder form.
- **Payment Gateway**: Integration with Stripe (or PayPal) for secure checkouts.
- **Enrollment Access**: Guard "Paid" courses, only granting access after successful transaction sync in Firestore.

### 🗺️ Roadmap for Beginners
1. **Database Schema**: Add `price` (number) and `isPaid` (boolean) to the `dynamic_courses` collection.
2. **CMS UI Upgrade**: Open `js/components/instructor-dashboard.js` and add a new "Price" input field to the Course Builder tab.
3. **Checkout Portal**: Create a dedicated `#/checkout/:courseId` route that summarizes the course information and provides a "Pay Now" button.
4. **Stripe Session**: Use Stripe's `checkout-session` API to handle the financial transaction.
5. **Post-Payment Sync**: On successful payment, update the user's `enrollments` object in Firestore with `status: "paid"`.

### 🛠️ Skills Needed
- JavaScript (Async/Await)
- Firebase Firestore (Updating deeply nested objects)
- Basic knowledge of Stripe/PayPal APIs
"@
Create-Issue -Title "[Evolution] Monetization Engine: Paid Courses & Payment Integration" -Body $body1 -Labels "enhancement,professional-evolution"

# 2. Professional Certification Center
$body2 = @"
### 🎯 Objective
Issue high-value, verifiable digital certificates that students can use to prove their skills on LinkedIn and to employers.

### ✨ Key Features
- **Dynamic Certificate Generation**: Automatically create uniquely designed, name-branded certificates upon course completion.
- **Verification Hub**: A public validation portal (`#/verify/:certId`) for authenticity checks.
- **LinkedIn One-Click**: "Add to LinkedIn Profile" integration.

### 🗺️ Roadmap for Beginners
1. **Design the Template**: Create a professional HTML/CSS certificate template in a new component `js/components/certificate-renderer.js`.
2. **Export to Image/PDF**: Use a library like `html2canvas` or a serverless function to convert the HTML/CSS into a shareable image.
3. **Firestore Metadata**: Store certificate hash/IDs in a new subcollection under `users/{uid}/certifications`.
4. **Verification Portal**: Implement a new public route in `app.js` that checks a certificate's ID and displays the student's name and completion date.

### 🛠️ Skills Needed
- CSS Layouts (Print/Certificate styling)
- DOM-to-Image libraries
- Firestore Querying
"@
Create-Issue -Title "[Evolution] Certification Center: Verifiable Digital Credentials" -Body $body2 -Labels "enhancement,professional-evolution"

# 3. Membership & Subscription Model
$body3 = @"
### 🎯 Objective
Build recurring revenue and a prestige community by implementing a subscription model for "Pro" and "Free" tiers.

### ✨ Key Features
- **Subscription Tiers**: Pro ($/mo), Yearly ($/yr), Enterprise ($/group).
- **Pro-Only Content**: Ability to lock specific lessons or advanced courses behind the "Pro" membership.
- **Member Badges**: Give Pro users distinctive UI elements (like a golden avatar halo or special profile badges).

### 🗺️ Roadmap for Beginners
1. **User Profile Update**: Add `subscriptionStatus` and `expiryDate` fields to the Firestore user profile.
2. **Access Middleware**: In `js/components/sidebar.js` and the lesson renderer, add logic to check if a lesson is `isPro` and the user's status.
3. **Pricing UI**: Design a beautiful "Upgrade to Pro" pricing table on the landing page and user settings.
4. **Member Perks**: Add a special "Pro Member" badge to the global navbar for subscribed users.

### 🛠️ Skills Needed
- User Authentication state management
- UI/UX Consistency
- Access Control logic
"@
Create-Issue -Title "[Evolution] Membership Model: Multi-tiered Subscription System" -Body $body3 -Labels "enhancement,professional-evolution"

# 4. Corporate Sponsorship & Partner Program
$body4 = @"
### 🎯 Objective
Collaborate with industry leaders by allowing organizations to sponsor courses and host partner-led content.

### ✨ Key Features
- **Sponsor Badges**: "Sponsored by [Google/Microsoft]" banners on course cards and within the video player.
- **Partner CMS**: specialized view for sponsors to see engagement metrics for their content.
- **Partner Directory**: A landing page section showcasing all active platform partners.

### 🗺️ Roadmap for Beginners
1. **Sponsor Schema**: Create a `sponsors` collection in Firestore with fields for `name`, `logoUrl`, and `website`.
2. **CMS Integration**: Add a "Co-Sponsored By" dropdown to the `InstructorDashboard.js` Course Builder.
3. **UI Overlay**: Add a small, elegant "Partnered with..." badge to the course thumbnail in `renderCoursesPage`.
4. **Engagement Sync**: Track enrollment metrics specifically for sponsored content to provide value reports to partners.

### 🛠️ Skills Needed
- Advanced DOM rendering
- Firestore Document Relations
- UI Component integration
"@
Create-Issue -Title "[Evolution] Partner Program: Corporate Sponsorship & Branded Courses" -Body $body4 -Labels "enhancement,professional-evolution"

# 5. Advanced Admin Panel 3.0: Financial & Membership Ops
$body5 = @"
### 🎯 Objective
Empower administrators with high-level control over the platform's financial and professional infrastructure.

### ✨ Key Features
- **Revenue Dashboard**: Real-time sales charts and subscription health reports.
- **Membership Management**: Ability for admins to manually upgrade/downgrade user tiers or issue refunds.
- **Certification Queue**: A specific dashboard tab to review student project submissions before final certificate release.

### 🗺️ Roadmap for Beginners
1. **Admin UI Tabs**: Add "Revenue" and "Certificates" tabs to the `js/components/admin-dashboard.js`.
2. **Financial Data Hooks**: Fetch transaction records from Firebase and use a library like `Chart.js` to render simple bar/line charts.
3. **User Management++**: Enhance the user table to show "Payment Status" and "Certificates Issued".
4. **Approval Logic**: Add a "Approve for Certificate" button to the `Portfolio` review view for admins.

### 🛠️ Skills Needed
- Data Visualization (Charts)
- Advanced Admin UI design
- Complex Firestore Querying
"@
Create-Issue -Title "[Evolution] Admin Panel 3.0: Financial Reporting & Membership Ops" -Body $body5 -Labels "enhancement,professional-evolution,admin"

Write-Host "All Professional Evolution issues generated in script."
Write-Host "To execute, ensure 'gh' CLI is installed and run: ./scripts/create_professional_issues.ps1"
