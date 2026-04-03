import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { authService } from '../services/auth-service.js';
import { paymentService } from '../services/payment-service.js';

export class CertificatesComponent {
  constructor() {
    this.certificates = [];
  }

  async init() {
    await this.loadCertificates();
    this.render();
  }

  async loadCertificates() {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      // Get completed courses that don't have certificates yet
      const completedCourses = this.getCompletedCourses();

      for (const course of completedCourses) {
        // Check if certificate already exists
        const existingCert = this.certificates.find(c => c.courseId === course.id);
        if (!existingCert) {
          // Auto-generate certificate for completed courses
          try {
            const certificateUrl = await paymentService.generateCertificate(user.uid, course.id);
            this.certificates.push({
              id: `cert_${course.id}_${Date.now()}`,
              courseId: course.id,
              courseName: course.title,
              completionDate: new Date().toISOString(),
              certificateUrl: certificateUrl,
              status: 'generated'
            });
          } catch (error) {
            console.error('Failed to generate certificate for course:', course.id, error);
          }
        }
      }

      // Load existing certificates from storage
      const storedCerts = storage.getCertificates();
      this.certificates = [...this.certificates, ...storedCerts];

    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  }

  getCompletedCourses() {
    const coursesData = window.coursesData || [];
    return coursesData.filter(course => {
      const lessonCount = this.getCourseLessonCount(course.id, course.totalLessons);
      return storage.getCourseCompletionPercent(course.id, lessonCount) === 100;
    });
  }

  getCourseLessonCount(courseId, totalLessons) {
    // This is a simplified version - in reality you'd count actual lessons
    return totalLessons || 10;
  }

  render() {
    const app = $('#app');
    if (!app) return;

    const user = authService.getCurrentUser();
    if (!user) {
      app.innerHTML = `
        <div class="page-wrapper">
          <div class="container text-center" style="padding:var(--space-16);">
            <h1>Please sign in to view certificates</h1>
            <a href="#/login" class="btn btn-primary">Sign In</a>
          </div>
        </div>
      `;
      return;
    }

    app.innerHTML = `
    <div class="page-wrapper bg-dots-pattern">
      <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); max-width:1000px;">
        <div class="text-center" style="margin-bottom:var(--space-12);">
          <span class="badge badge-primary" style="margin-bottom:var(--space-4);">Achievements</span>
          <h1 style="font-size:3rem; margin-bottom:var(--space-4);">
            Your <span class="text-gradient">Certificates</span>
          </h1>
          <p style="font-size:1.1rem; color:var(--text-secondary); max-width:600px; margin:0 auto;">
            Celebrate your accomplishments with professionally designed certificates for each completed course.
          </p>
        </div>

        ${this.certificates.length === 0 ? `
          <div class="card text-center" style="padding:var(--space-12);">
            <div style="font-size:4rem; color:var(--text-muted); margin-bottom:var(--space-6);">
              <i class="fa-solid fa-certificate"></i>
            </div>
            <h3 style="margin-bottom:var(--space-4);">No certificates yet</h3>
            <p style="color:var(--text-secondary); margin-bottom:var(--space-6);">
              Complete your first course to earn a certificate of completion.
            </p>
            <a href="#/courses" class="btn btn-primary">Browse Courses</a>
          </div>
        ` : `
          <div class="grid grid-2 gap-6">
            ${this.certificates.map(cert => `
              <div class="card certificate-card" style="overflow:hidden;">
                <div class="certificate-preview" style="background:linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%); padding:var(--space-8); text-align:center; color:white; position:relative;">
                  <div style="position:absolute; top:20px; right:20px; font-size:2rem; opacity:0.3;">
                    <i class="fa-solid fa-certificate"></i>
                  </div>
                  <div style="font-size:3rem; margin-bottom:var(--space-4);">
                    <i class="fa-solid fa-graduation-cap"></i>
                  </div>
                  <h3 style="margin-bottom:var(--space-2); font-size:1.5rem;">Certificate of Completion</h3>
                  <p style="opacity:0.9; margin-bottom:var(--space-4);">Awarded to</p>
                  <h4 style="font-size:1.2rem; margin-bottom:var(--space-2);">${authService.getDisplayName()}</h4>
                  <p style="opacity:0.8; margin-bottom:0;">For completing ${cert.courseName}</p>
                </div>

                <div style="padding:var(--space-6);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
                    <div>
                      <h4 style="margin:0; font-size:1.1rem;">${cert.courseName}</h4>
                      <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">
                        Completed ${new Date(cert.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span class="badge badge-success">
                      <i class="fa-solid fa-check"></i> Completed
                    </span>
                  </div>

                  <div style="display:flex; gap:var(--space-3);">
                    <button class="btn btn-primary" onclick="downloadCertificate('${cert.id}')" style="flex:1;">
                      <i class="fa-solid fa-download"></i> Download
                    </button>
                    <button class="btn btn-outline" onclick="shareCertificate('${cert.id}')" style="flex:1;">
                      <i class="fa-solid fa-share"></i> Share
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <div class="card" style="margin-top:var(--space-8);">
          <h3 style="margin-bottom:var(--space-4);">How to Earn Certificates</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:var(--space-4);">
            <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
              <div style="width:32px; height:32px; background:var(--brand-primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0;">1</div>
              <div>
                <h4 style="margin:0 0 var(--space-2); font-size:1rem;">Complete a Course</h4>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin:0;">Finish all lessons and assessments in any course.</p>
              </div>
            </div>
            <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
              <div style="width:32px; height:32px; background:var(--brand-primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0;">2</div>
              <div>
                <h4 style="margin:0 0 var(--space-2); font-size:1rem;">Auto-Generation</h4>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin:0;">Certificates are automatically generated upon completion.</p>
              </div>
            </div>
            <div style="display:flex; gap:var(--space-3); align-items:flex-start;">
              <div style="width:32px; height:32px; background:var(--brand-primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0;">3</div>
              <div>
                <h4 style="margin:0 0 var(--space-2); font-size:1rem;">Download & Share</h4>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin:0;">Download as PDF or share your achievement on social media.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    // Add global functions for certificate actions
    window.downloadCertificate = (certId) => {
      const cert = this.certificates.find(c => c.id === certId);
      if (cert && cert.certificateUrl) {
        // In production, this would download the actual PDF
        // For now, we'll simulate the download
        const link = document.createElement('a');
        link.href = cert.certificateUrl;
        link.download = `ProCode_Certificate_${cert.courseName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Certificate downloaded!', 'success');
      } else {
        showToast('Certificate not available for download.', 'error');
      }
    };

    window.shareCertificate = (certId) => {
      const cert = this.certificates.find(c => c.id === certId);
      if (cert) {
        const shareText = `I just earned a certificate for completing "${cert.courseName}" on ProCode EduPulse! 🚀 #LearnToCode #Certificate`;
        const shareUrl = window.location.origin;

        if (navigator.share) {
          navigator.share({
            title: 'ProCode Certificate',
            text: shareText,
            url: shareUrl
          });
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          showToast('Certificate link copied to clipboard!', 'success');
        }
      }
    };
  }
}

export function renderCertificates() {
  const certificates = new CertificatesComponent();
  return certificates.init();
}
