// ============================================
// ProCode EduPulse — Portfolio Component
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';

/**
 * Portfolio UI component.
 */
export class PortfolioComponent {
  /**
   * Create a PortfolioComponent instance.
   * @param {string|Element} container
   */
  constructor(container) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.render();
    }

    /**
     * Render portfolio UI.
     * @returns {void}
     */
    render() {
        const submissions = storage.getPassedSubmissions();

        this.container.innerHTML = `
      <div class="container" style="padding-top:var(--space-8);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left">
          <span class="section-badge"><i class="fa-solid fa-graduation-cap"></i> Your Work</span>
          <h1 class="section-title">Project Portfolio</h1>
          <p class="section-subtitle" style="margin:0">
            All your completed coding challenges compiled in one place. 
            ${submissions.length > 0 ? 'Download them as a project!' : ''}
          </p>
        </div>

        ${submissions.length === 0 ? `
          <div class="empty-state" style="padding:var(--space-16) 0">
            <div class="empty-state-icon"><i class="fa-solid fa-hammer" style="font-size:3rem;color:var(--text-muted)"></i></div>
            <div class="empty-state-title">No projects yet</div>
            <div class="empty-state-text">Complete coding challenges to build your portfolio. Each challenge you pass gets added here!</div>
            <a href="#/courses" class="btn btn-primary" style="margin-top:var(--space-6)">Browse Courses</a>
          </div>
        ` : `
          <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-8)">
            <button class="btn btn-primary" id="download-all-btn">
              <i class="fa-solid fa-box-archive"></i> Download All as ZIP
            </button>
            <div class="badge badge-success" style="font-size:var(--text-sm);padding:var(--space-2) var(--space-4)">
              ${submissions.length} project${submissions.length > 1 ? 's' : ''}
            </div>
          </div>

          <div class="grid gap-6" style="grid-template-columns:repeat(auto-fill,minmax(400px,1fr))">
            ${submissions.map((sub, i) => this._renderProject(sub, i)).join('')}
          </div>
        `}
      </div>
    `;

        this._attachEvents();
    }

    /**
     * Render a project card.
     * @param {object} submission
     * @param {number} index
     * @returns {string}
     */
    _renderProject(submission, index) {
        return `
      <div class="card" style="overflow:hidden" data-animate data-index="${index}">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-1)">${submission.challengeId}</h3>
            <span class="text-sm text-muted">${new Date(submission.submittedAt).toLocaleDateString()}</span>
          </div>
          <span class="badge badge-success"><i class="fa-solid fa-check"></i> Passed</span>
        </div>
        
        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);max-height:200px;overflow:auto">
          <pre style="margin:0;font-size:var(--text-xs);white-space:pre-wrap;color:var(--text-secondary)"><code>${this._escapeHTML(submission.code)}</code></pre>
        </div>

        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-secondary btn-sm download-single" data-index="${index}">
            <i class="fa-solid fa-download"></i> Download
          </button>
          <button class="btn btn-ghost btn-sm preview-btn" data-index="${index}">
            <i class="fa-solid fa-eye"></i> Preview
          </button>
        </div>
      </div>
    `;
    }

    /**
     * Escape HTML for safe rendering.
     * @param {string} str
     * @returns {string}
     */
    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Attach UI event handlers.
     * @returns {void}
     */
    _attachEvents() {
        const submissions = storage.getPassedSubmissions();

        // Download all
        const downloadAllBtn = $('#download-all-btn', this.container);
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', async () => {
                await this._downloadAllAsZip(submissions);
            });
        }

        // Download single
        this.container.querySelectorAll('.download-single').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const sub = submissions[index];
                if (sub) this._downloadFile(sub);
            });
        });

        // Preview
        this.container.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const sub = submissions[index];
                if (sub) this._previewCode(sub);
            });
        });
    }

    /**
     * Download a single submission as HTML.
     * @param {object} submission
     * @returns {void}
     */
    _downloadFile(submission) {
        const filename = `${submission.challengeId.replace(/\s+/g, '-').toLowerCase()}.html`;
        const blob = new Blob([submission.code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast('File downloaded!', 'success');
    }

    /**
     * Download all submissions as a ZIP.
     * @param {Array<object>} submissions
     * @returns {Promise<void>}
     */
    async _downloadAllAsZip(submissions) {
        try {
            // Dynamically load JSZip
            const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
            const zip = new JSZip();

            const projectFolder = zip.folder('procode-portfolio');

            // Add index.html with links
            let indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My ProCode Portfolio</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #0F0F1A; color: #F0F0F8; }
    h1 { color: #A29BFE; }
    .project { background: #1A1A2E; border: 1px solid rgba(108,92,231,0.2); border-radius: 12px; padding: 20px; margin: 16px 0; }
    .project h3 { margin: 0 0 8px; }
    a { color: #00D2D3; }
  </style>
</head>
<body>
  <h1>🎓 My ProCode Portfolio</h1>
  <p>Completed ${submissions.length} coding challenges</p>
  ${submissions.map((s, i) => `
  <div class="project">
    <h3>${s.challengeId}</h3>
    <p>Completed: ${new Date(s.submittedAt).toLocaleDateString()}</p>
    <a href="challenge-${i + 1}.html">View Project →</a>
  </div>`).join('')}
</body>
</html>`;

            projectFolder.file('index.html', indexHTML);

            submissions.forEach((sub, i) => {
                projectFolder.file(`challenge-${i + 1}.html`, sub.code);
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'procode-portfolio.zip';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Portfolio downloaded as ZIP!', 'success');
        } catch (error) {
            console.error('ZIP download failed:', error);
            showToast('Failed to create ZIP. Downloading files individually...', 'warning');
            submissions.forEach(s => this._downloadFile(s));
        }
    }

    /**
     * Preview a submission in a modal.
     * @param {object} submission
     * @returns {void}
     */
    _previewCode(submission) {
        // Create modal with preview
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
      <div class="modal" style="max-width:800px;width:95%">
        <div class="modal-header">
          <span class="modal-title">${submission.challengeId}</span>
          <button class="modal-close" id="preview-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <iframe style="width:100%;height:400px;border:none;border-radius:var(--radius-md);background:#fff" sandbox="allow-scripts" title="Preview"></iframe>
      </div>
    `;

        document.body.appendChild(overlay);

        const iframe = overlay.querySelector('iframe');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(submission.code);
        doc.close();

        overlay.querySelector('#preview-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }
}
