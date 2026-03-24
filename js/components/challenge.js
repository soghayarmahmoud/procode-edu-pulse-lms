// ============================================
// ProCode EduPulse — Coding Challenge Component
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { ValidationEngine } from '../services/validation.js';
import { aiService } from '../services/ai-service.js';
import { RemoteExecutionService } from '../services/remote-execution.js';
import { discussionService } from '../services/discussion-service.js';
import { DiscussionComponent } from './discussion.js';
import { CodeEditor, updatePreview } from './code-editor.js';

export class ChallengeComponent {
    constructor(container, challengeData, courseId, lessonId) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.challenge = challengeData;
        this.courseId = courseId;
        this.lessonId = lessonId;
        this.editor = null;
        this.render();
    }

    render() {
        const existingSub = storage.getSubmission(this.challenge.title);

        this.container.innerHTML = `
      <div class="assessment-section">
        <div class="assessment-header">
          <div class="assessment-title">
            <i class="fa-solid fa-rocket"></i> <span>Coding Challenge: ${this.challenge.title}</span>
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-3)">
            <span class="badge badge-primary">${this.challenge.difficulty}</span>
            ${existingSub?.passed ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Completed</span>' : ''}
          </div>
        </div>
        
        <div class="challenge-container">
          <div class="challenge-instructions">
            <h4><i class="fa-solid fa-clipboard"></i> Instructions</h4>
            <p>${this.challenge.instructions.replace(/\n/g, '<br>')}</p>
          </div>

          <div class="challenge-editor-wrapper">
            <div class="editor-header">
              <div class="editor-tabs">
                <span class="editor-tab active">${this.challenge.language || 'index.html'}</span>
              </div>
              <div class="editor-actions">
                <button class="editor-action-btn" id="challenge-reset-code" title="Reset code">
                  <i class="fa-solid fa-rotate-left"></i> Reset
                </button>
                <button class="editor-action-btn" id="challenge-copy-code" title="Copy code">
                  <i class="fa-solid fa-clipboard"></i> Copy
                </button>
              </div>
            </div>
            <div class="editor-body" id="challenge-editor" style="min-height:300px"></div>
          </div>

          <div class="preview-panel">
            <div class="preview-header">
              <span class="preview-title"><i class="fa-solid fa-eye"></i> Live Preview</span>
            </div>
            <iframe class="preview-iframe" id="challenge-preview" sandbox="allow-scripts" title="Code preview"></iframe>
          </div>

          <div class="challenge-result" id="challenge-result"></div>

          <div class="hint-container" id="hint-container">
            <div class="hint-header"><i class="fa-solid fa-lightbulb"></i> Hint</div>
            <div class="hint-content" id="hint-content"></div>
          </div>

          <div class="challenge-actions">
            <button class="btn btn-outline btn-sm" id="challenge-hint-btn">
              <i class="fa-solid fa-lightbulb"></i> Get a Hint
            </button>
            <button class="btn btn-secondary btn-sm" id="challenge-discuss-btn">
              <i class="fa-solid fa-comments"></i> Discussions
            </button>
            <button class="btn btn-secondary btn-sm" id="challenge-review-btn">
              <i class="fa-solid fa-users"></i> Code Review
            </button>
            <button class="btn btn-primary" id="challenge-submit-btn">
              <i class="fa-solid fa-check"></i> Submit Solution
            </button>
          </div>
          
          <div id="challenge-discussion-panel" style="display:none; margin-top:var(--space-6); border-top:1px solid var(--border-subtle); padding-top:var(--space-6);"></div>
        </div>
      </div>
    `;

        // Initialize editor
        setTimeout(() => {
            const startCode = existingSub?.code || this.challenge.starterCode;
            this.editor = new CodeEditor('#challenge-editor', {
                language: this.challenge.language || 'html',
                initialCode: startCode,
                onChange: (code) => {
                    updatePreview('#challenge-preview', code);
                }
            });

            // Initial preview
            setTimeout(() => updatePreview('#challenge-preview', startCode), 500);
        }, 100);

        this._attachEvents();
    }

    _attachEvents() {
        // Submit
        $('#challenge-submit-btn', this.container).addEventListener('click', () => this.submit());

        // Hint
        $('#challenge-hint-btn', this.container).addEventListener('click', () => this.getHint());

        // Discussions toggle
        $('#challenge-discuss-btn', this.container).addEventListener('click', () => this.toggleDiscussions());

        // Request Code Review
        $('#challenge-review-btn', this.container).addEventListener('click', () => this.requestCodeReview());

        // Reset
        $('#challenge-reset-code', this.container).addEventListener('click', () => {
            if (this.editor) {
                this.editor.setCode(this.challenge.starterCode);
                updatePreview('#challenge-preview', this.challenge.starterCode);
            }
        });

        // Copy
        $('#challenge-copy-code', this.container).addEventListener('click', () => {
            if (this.editor) {
                navigator.clipboard.writeText(this.editor.getCode())
                    .then(() => showToast('Code copied to clipboard!', 'success'))
                    .catch(() => showToast('Failed to copy', 'error'));
            }
        });
    }

    async submit() {
        if (!this.editor) return;

        const code = this.editor.getCode();
        const resultEl = $('#challenge-result', this.container);
        const btn = $('#challenge-submit-btn', this.container);

        btn.disabled = true;
        
        // Add minimal inline styles for spinner just in case
        btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid;border-radius:50%;border-top-color:transparent;animation:spin 1s linear infinite;margin-right:8px;"></span> Executing...';

        let result;

        try {
            if (this.challenge.type === 'backend' || this.challenge.testCode) {
                // Remote Execution via Piston API
                result = await RemoteExecutionService.execute(
                    this.challenge.language || 'python', 
                    code, 
                    this.challenge.testCode
                );
            } else {
                // Frontend DOM/Regex Validation
                result = ValidationEngine.validate(code, this.challenge.validationRules);
            }
        } catch (e) {
            result = { pass: false, feedback: `Execution Error: ${e.message}` };
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Solution';

        resultEl.className = `challenge-result visible ${result.pass ? 'success' : 'failure'}`;
        resultEl.innerHTML = `
      <span style="font-size:1.5rem"><i class="fa-solid ${result.pass ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></span>
      <div>
        <strong>${result.pass ? 'All checks passed!' : 'Some checks failed'}</strong>
        <div style="margin-top:var(--space-2);white-space:pre-line;font-family:monospace;">${result.feedback}</div>
      </div>
    `;

        const existingSub = storage.getSubmission(this.challenge.title);
        const alreadyPassed = existingSub?.passed;

        // Save submission locally
        storage.saveSubmission(this.challenge.title, code, result.pass);

        if (result.pass) {
            if (!alreadyPassed) {
                storage.addGems(50);
                showToast('Challenge completed! +50 Gems 💎', 'success');
                
                // Sync to Cloud
                import('../services/auth-service.js').then(({ authService }) => {
                    import('../services/firestore-service.js').then(({ firestoreService }) => {
                        const uid = authService.getUid();
                        if (uid) {
                            firestoreService.saveUserProfile(uid, { gems: storage.getGems() });
                            firestoreService.saveSubmissions(uid, storage.getSubmissions());
                        }
                    });
                });
                
                // Re-render navbar to update gems display
                import('./navbar.js').then(m => m.renderNavbar());
            } else {
                showToast('Challenge already completed! Great job reviewing.', 'success');
            }
            
            storage.completeLesson(this.courseId, this.lessonId);
            import('../services/auth-service.js').then(({ authService }) => {
                import('../services/firestore-service.js').then(({ firestoreService }) => {
                    const uid = authService.getUid();
                    if (uid) firestoreService.saveProgress(uid, storage.getProgress());
                });
            });
        }
    }

    async getHint() {
        const hintContainer = $('#hint-container', this.container);
        const hintContent = $('#hint-content', this.container);

        hintContainer.classList.add('visible');
        hintContent.innerHTML = `
      <div class="hint-loading">
        <div class="spinner"></div>
        <span>Thinking of a helpful hint...</span>
      </div>
    `;

        const code = this.editor ? this.editor.getCode() : '';
        const hint = await aiService.getHint({
            challengeTitle: this.challenge.title,
            instructions: this.challenge.instructions,
            studentCode: code,
            language: this.challenge.language || 'html'
        });

        hintContent.textContent = hint;
    }

    async toggleDiscussions() {
        const panel = $('#challenge-discussion-panel', this.container);
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            if (!this.discussionComponent) {
                this.discussionComponent = new DiscussionComponent('#challenge-discussion-panel', this.challenge.title, { title: 'Challenge Discussions' });
            }
        } else {
            panel.style.display = 'none';
        }
    }

    async requestCodeReview() {
        if (!this.editor) return;
        const code = this.editor.getCode();
        
        if (!code || code.trim().length === 0) {
            return showToast('Please write some code before requesting a review.', 'warning');
        }

        const btn = $('#challenge-review-btn', this.container);
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-sm"></div> Sending...';

        const thread = await discussionService.createThread(
            this.challenge.title, 
            'Code Review Request', 
            'Can someone please review my approach to this challenge?', 
            code
        );

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-users"></i> Code Review';

        if (thread) {
            showToast('Code Review requested successfully!', 'success');
            // Force open the discussion panel to see it
            const panel = $('#challenge-discussion-panel', this.container);
            panel.style.display = 'block';
            this.discussionComponent = new DiscussionComponent('#challenge-discussion-panel', this.challenge.title, { title: 'Challenge Discussions' });
        } else {
            showToast('Failed to request review.', 'error');
        }
    }

    destroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
}
