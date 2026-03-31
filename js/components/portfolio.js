// ============================================
// ProCode EduPulse — Portfolio Component
// ============================================

import { $, showToast, animateOnScroll, $$ } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { firestoreService } from '../services/firestore-service.js';

/**
 * Portfolio UI component.
 */
export class PortfolioComponent {
    constructor(container) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.currentTab = 'tutorials'; // 'tutorials' or 'submissions'
        this.isLoading = false;
        
        if (!this.container) {
            console.error('PortfolioComponent: Container element not found');
            return;
        }
        
        this.render();
    }

    async render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
      <div class="container" style="padding-top:var(--space-8);padding-bottom:var(--space-16)">
        <div class="section-header" style="text-align:left; margin-bottom:var(--space-8)">
          <span class="section-badge"><i class="fa-solid fa-briefcase"></i> Project Showcase</span>
          <h1 class="section-title">Portfolio Vault</h1>
          <p class="section-subtitle" style="margin:0">
            Learn from expert tutorials and manage your completed coding challenges.
          </p>
        </div>

        <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-8); border-bottom:1px solid var(--border-subtle); padding-bottom:var(--space-2)">
            <button class="btn ${this.currentTab === 'tutorials' ? 'btn-primary' : 'btn-ghost'} portfolio-tab" data-tab="tutorials">
                <i class="fa-solid fa-graduation-cap"></i> Project Tutorials
            </button>
            <button class="btn ${this.currentTab === 'submissions' ? 'btn-primary' : 'btn-ghost'} portfolio-tab" data-tab="submissions">
                <i class="fa-solid fa-hammer"></i> My Submissions
            </button>
        </div>

        <div id="portfolio-content-area" style="min-height: 400px;">
           <div style="text-align:center; padding:var(--space-16); color:var(--text-muted);"><div class="spinner-sm" style="margin:0 auto"></div></div>
        </div>
      </div>
    `;

        this._attachTabEvents();
        await this._loadCurrentTab();
    }

    _attachTabEvents() {
        $$('.portfolio-tab', this.container).forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (this.isLoading) return;
                
                this.currentTab = e.currentTarget.dataset.tab;
                
                $$('.portfolio-tab', this.container).forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-ghost');
                });
                e.currentTarget.classList.add('btn-primary');
                e.currentTarget.classList.remove('btn-ghost');
                
                await this._loadCurrentTab();
            });
        });
    }

    async _loadCurrentTab() {
        if (this.isLoading) return;
        
        const area = $('#portfolio-content-area', this.container);
        if (!area) return;
        
        this.isLoading = true;
        area.style.opacity = '0';
        
        try {
            setTimeout(async () => {
                try {
                    if (this.currentTab === 'tutorials') {
                        await this._renderTutorialsTab(area);
                    } else {
                        await this._renderSubmissionsTab(area);
                    }
                    area.style.transition = 'opacity 0.3s ease';
                    area.style.opacity = '1';
                    
                    // Only call animateOnScroll if it exists
                    if (typeof animateOnScroll === 'function') {
                        animateOnScroll();
                    }
                } catch (error) {
                    console.error('Error loading tab:', error);
                    area.innerHTML = this._renderErrorState('Failed to load content. Please try again.');
                } finally {
                    this.isLoading = false;
                }
            }, 150);
        } catch (error) {
            console.error('Error in _loadCurrentTab:', error);
            area.innerHTML = this._renderErrorState('Failed to load content. Please refresh the page.');
            this.isLoading = false;
        }
    }

    _renderErrorState(message) {
        return `
            <div class="empty-state" style="padding:var(--space-16) 0">
                <div class="empty-state-icon"><i class="fa-solid fa-circle-exclamation" style="font-size:3rem;color:var(--color-error)"></i></div>
                <div class="empty-state-title">Error</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
    }

    async _renderTutorialsTab(area) {
        area.innerHTML = '<div style="text-align:center; padding:var(--space-8);"><div class="spinner-sm" style="margin:0 auto"></div></div>';
        
        let portfolios = [];
        try {
            portfolios = await firestoreService.getDynamicPortfolios();
        } catch (error) {
            console.error('Failed to fetch portfolios:', error);
            area.innerHTML = this._renderErrorState('Unable to load tutorials. Please check your connection and try again.');
            return;
        }
        
        if (!portfolios || portfolios.length === 0) {
            area.innerHTML = `
                <div class="empty-state" style="padding:var(--space-16) 0">
                    <div class="empty-state-icon"><i class="fa-solid fa-book-open" style="font-size:3rem;color:var(--text-muted)"></i></div>
                    <div class="empty-state-title">No Tutorials Published</div>
                    <div class="empty-state-text">Check back later for new expert-led project tutorials!</div>
                </div>
            `;
            return;
        }

        area.innerHTML = `
            <div class="grid gap-6 grid-3">
                ${portfolios.map((p, i) => `
                    <div class="card course-card" onclick="window.location.hash='#/portfolio/${p.id}'" style="cursor:pointer;" data-animate data-index="${i}">
                        <div class="course-body">
                            <div class="course-meta">
                              <span class="badge badge-primary">${this._escapeHTML(p.difficulty || 'Intermediate')}</span>
                              <span class="text-sm text-muted">${this._escapeHTML(p.estimatedTime || '2h')}</span>
                            </div>
                            <h3 class="course-title">${this._escapeHTML(p.title)}</h3>
                            <p class="course-desc">${this._escapeHTML(p.description || 'No description available.')}</p>
                            <div class="course-footer" style="margin-top:var(--space-4)">
                                <span class="btn btn-sm btn-outline">Start Project <i class="fa-solid fa-arrow-right"></i></span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async _renderSubmissionsTab(area) {
        let submissions = [];
        try {
            submissions = storage.getPassedSubmissions();
        } catch (error) {
            console.error('Failed to get submissions:', error);
            area.innerHTML = this._renderErrorState('Unable to load your submissions.');
            return;
        }

        if (!submissions || submissions.length === 0) {
            area.innerHTML = `
              <div class="empty-state" style="padding:var(--space-16) 0">
                <div class="empty-state-icon"><i class="fa-solid fa-hammer" style="font-size:3rem;color:var(--text-muted)"></i></div>
                <div class="empty-state-title">No projects yet</div>
                <div class="empty-state-text">Complete coding challenges to build your portfolio. Each challenge you pass gets added here!</div>
                <a href="#/courses" class="btn btn-outline" style="margin-top:var(--space-6)">Browse Courses</a>
              </div>
            `;
            return;
        }

        area.innerHTML = `
          <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-8);flex-wrap:wrap;">
            <button class="btn btn-primary" id="download-all-btn">
              <i class="fa-solid fa-box-archive"></i> Download All as ZIP
            </button>
            <div class="badge badge-success" style="font-size:var(--text-sm);padding:var(--space-2) var(--space-4)">
              ${submissions.length} project${submissions.length > 1 ? 's' : ''}
            </div>
          </div>

          <div class="grid gap-6" style="grid-template-columns:repeat(auto-fill,minmax(400px,1fr))">
            ${submissions.map((sub, i) => this._renderProjectCard(sub, i)).join('')}
          </div>
        `;

        this._attachSubmissionEvents(area, submissions);
    }

    _renderProjectCard(submission, index) {
        const challengeId = submission.challengeId || 'Untitled Project';
        const code = submission.code || '';
        const submittedAt = submission.submittedAt || Date.now();
        
        return `
      <div class="card" style="overflow:hidden" data-animate data-index="${index}">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-1)">${this._escapeHTML(challengeId)}</h3>
            <span class="text-sm text-muted">${new Date(submittedAt).toLocaleDateString()}</span>
          </div>
          <span class="badge badge-success"><i class="fa-solid fa-check"></i> Passed</span>
        </div>
        
        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-4);max-height:200px;overflow:auto">
          <pre style="margin:0;font-size:var(--text-xs);white-space:pre-wrap;color:var(--text-secondary)"><code>${this._escapeHTML(code.substring(0, 1000))}${code.length > 1000 ? '\n\n... (truncated)' : ''}</code></pre>
        </div>

        <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
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

    _escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _attachSubmissionEvents(area, submissions) {
        const downloadAllBtn = $('#download-all-btn', area);
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', async () => {
                if (this.isLoading) return;
                await this._downloadAllAsZip(submissions);
            });
        }

        area.querySelectorAll('.download-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const sub = submissions[index];
                if (sub) this._downloadFile(sub);
            });
        });

        area.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const sub = submissions[index];
                if (sub) this._previewCode(sub);
            });
        });
    }

    _downloadFile(submission) {
        const filename = `${(submission.challengeId || 'project').replace(/\s+/g, '-').toLowerCase()}.html`;
        const code = submission.code || '<!-- No code available -->';
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof showToast === 'function') {
            showToast('File downloaded!', 'success');
        }
    }

    async _downloadAllAsZip(submissions) {
        try {
            // Dynamic import for JSZip
            const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
            const zip = new JSZip();

            const projectFolder = zip.folder('procode-portfolio');

            const validSubmissions = submissions.filter(s => s && s.code);
            
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
    a { color: #00D2D3; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🎓 My ProCode Portfolio</h1>
  <p>Completed ${validSubmissions.length} coding challenge${validSubmissions.length !== 1 ? 's' : ''}</p>
  ${validSubmissions.map((s, i) => `
  <div class="project">
    <h3>${this._escapeHTML(s.challengeId || 'Project ' + (i + 1))}</h3>
    <p>Completed: ${new Date(s.submittedAt || Date.now()).toLocaleDateString()}</p>
    <a href="challenge-${i + 1}.html">View Project →</a>
  </div>`).join('')}
</body>
</html>`;

            projectFolder.file('index.html', indexHTML);

            validSubmissions.forEach((sub, i) => {
                const code = sub.code || '<!-- No code available -->';
                projectFolder.file(`challenge-${i + 1}.html`, code);
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'procode-portfolio.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (typeof showToast === 'function') {
                showToast('Portfolio downloaded as ZIP!', 'success');
            }
        } catch (error) {
            console.error('ZIP download failed:', error);
            if (typeof showToast === 'function') {
                showToast('Failed to create ZIP. Downloading files individually...', 'warning');
            }
            submissions.forEach(s => {
                if (s && s.code) this._downloadFile(s);
            });
        }
    }

    _previewCode(submission) {
        if (!submission || !submission.code) return;
        
        // Remove any existing modals
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
        
        overlay.innerHTML = `
      <div class="modal" style="max-width:800px;width:95%;background:var(--bg-primary);border-radius:var(--radius-lg);max-height:90vh;display:flex;flex-direction:column;">
        <div class="modal-header" style="padding:var(--space-4) var(--space-6);border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <span class="modal-title" style="font-weight:600;">${this._escapeHTML(submission.challengeId || 'Code Preview')}</span>
          <button class="modal-close" id="preview-close" style="background:none;border:none;font-size:1.5rem;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="flex:1;overflow:auto;padding:var(--space-6);">
          <iframe style="width:100%;height:500px;border:none;border-radius:var(--radius-md);background:#fff" sandbox="allow-same-origin allow-scripts" title="Preview"></iframe>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        const iframe = overlay.querySelector('iframe');
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.open();
                doc.write(submission.code);
                doc.close();
            } catch (error) {
                console.error('Failed to load iframe content:', error);
                iframe.srcdoc = submission.code;
            }
        }

        const closeBtn = overlay.querySelector('#preview-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => overlay.remove());
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Clean up event listener when modal is removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && !document.body.contains(overlay)) {
                    document.removeEventListener('keydown', handleEscape);
                    observer.disconnect();
                }
            });
        });
        observer.observe(document.body, { childList: true });
    }
}

/**
 * Main renderer for individual tutorial project content.
 */
export async function renderPortfolioProject(params) {
    const app = $('#app');
    if (!app) {
        console.error('App container not found');
        return;
    }
    
    const id = params?.id;
    if (!id) {
        app.innerHTML = `
            <div class="page-wrapper bg-dots-pattern">
                <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); text-align:center;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--color-error); margin-bottom:var(--space-4);"></i>
                    <h2>Invalid Project</h2>
                    <p class="text-muted">No project ID provided.</p>
                    <a href="#/portfolio" class="btn btn-outline" style="margin-top:var(--space-6)">Back to Portfolio</a>
                </div>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="page-wrapper bg-dots-pattern">
             <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); max-width: 900px; margin: 0 auto; text-align:center;">
                 <div class="spinner-sm" style="margin: 0 auto;"></div>
                 <p class="text-muted" style="margin-top:var(--space-4)">Loading Project...</p>
             </div>
        </div>
    `;

    let portfolios = [];
    try {
        portfolios = await firestoreService.getDynamicPortfolios();
    } catch (error) {
        console.error('Failed to fetch portfolios:', error);
        app.innerHTML = `
            <div class="page-wrapper bg-dots-pattern">
                <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); text-align:center;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--color-error); margin-bottom:var(--space-4);"></i>
                    <h2>Connection Error</h2>
                    <p class="text-muted">Failed to load project. Please check your connection.</p>
                    <a href="#/portfolio" class="btn btn-outline" style="margin-top:var(--space-6)">Back to Portfolio</a>
                </div>
            </div>
        `;
        return;
    }
    
    const project = portfolios.find(p => p.id === id);

    if (!project) {
        app.innerHTML = `
            <div class="page-wrapper bg-dots-pattern">
                <div class="container" style="padding-top:var(--space-10);padding-bottom:var(--space-16); text-align:center;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--color-error); margin-bottom:var(--space-4);"></i>
                    <h2>Project Not Found</h2>
                    <p class="text-muted">The requested project tutorial could not be retrieved.</p>
                    <a href="#/portfolio" class="btn btn-outline" style="margin-top:var(--space-6)">Back to Portfolio</a>
                </div>
            </div>
        `;
        return;
    }

    try {
        const marked = await import('https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js');
        const htmlContent = marked.parse(project.content || 'No content available.');

        app.innerHTML = `
            <div class="page-wrapper">
                <!-- Hero Section -->
                <div style="background:var(--bg-elevated); padding:var(--space-12) 0; border-bottom:1px solid var(--border-subtle);">
                    <div class="container" style="max-width: 900px; margin: 0 auto;">
                        <a href="#/portfolio" class="btn btn-ghost btn-sm" style="margin-bottom:var(--space-6);">
                            <i class="fa-solid fa-arrow-left"></i> Back to Portfolio
                        </a>
                        <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-4); flex-wrap:wrap;">
                            <span class="badge badge-primary">${escapeHTML(project.difficulty || 'Intermediate')}</span>
                            <span class="badge badge-success"><i class="fa-solid fa-clock"></i> ${escapeHTML(project.estimatedTime || '2h')}</span>
                        </div>
                        <h1 style="font-size:3rem; margin-bottom:var(--space-4); background:var(--gradient-primary); -webkit-background-clip:text; -webkit-text-fill-color:transparent; word-break:break-word;">
                            ${escapeHTML(project.title)}
                        </h1>
                        <p style="font-size:1.2rem; color:var(--text-secondary); max-width:800px; line-height:1.6;">${escapeHTML(project.description || '')}</p>
                    </div>
                </div>

                <!-- Tutorial Content -->
                <div class="container" style="padding-top:var(--space-12); padding-bottom:var(--space-16); max-width: 900px; margin: 0 auto;">
                    <div class="card" style="padding:var(--space-8); background:var(--bg-elevated); box-shadow:var(--shadow-lg); overflow-x:auto;">
                        <div class="markdown-body" style="color:var(--text-primary); line-height:1.8;">
                            ${htmlContent}
                        </div>
                    </div>
                    
                    <div style="margin-top:var(--space-12); text-align:center; padding:var(--space-8); border:1px dashed var(--border-subtle); border-radius:var(--radius-lg);">
                        <h3 style="margin-bottom:var(--space-2);">Ready to build this?</h3>
                        <p class="text-muted" style="margin-bottom:var(--space-6);">Apply what you've learned to build your own version.</p>
                        <a href="#/collaborate" class="btn btn-primary btn-lg"><i class="fa-solid fa-code"></i> Open IDE workspace</a>
                    </div>
                </div>
            </div>
        `;

        // Wait to process syntax highlighting if using hljs
        if (window.hljs && typeof window.hljs.highlightElement === 'function') {
            setTimeout(() => {
                app.querySelectorAll('pre code').forEach((block) => {
                    window.hljs.highlightElement(block);
                });
            }, 100);
        }
    } catch (e) {
        console.error('Error rendering markdown:', e);
        app.innerHTML = `
            <div class="container" style="padding:var(--space-16); text-align:center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:3rem; color:var(--color-error);"></i>
                <h3>Error Loading Content</h3>
                <p class="text-muted">There was an error loading the project content.</p>
                <a href="#/portfolio" class="btn btn-outline" style="margin-top:var(--space-4)">Back to Portfolio</a>
            </div>
        `;
    }
}

// Helper function for escaping HTML
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}