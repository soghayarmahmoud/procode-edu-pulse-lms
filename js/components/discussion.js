import { $, showToast } from '../utils/dom.js';
import { discussionService } from '../services/discussion-service.js';
import { authService } from '../services/auth-service.js';

/**
 * Discussion UI component for Q&A threads.
 */
export class DiscussionComponent {
    /**
     * Create a DiscussionComponent instance.
     * @param {string} containerSelector
     * @param {string} contextId
     * @param {{title?: string}} [options={}]
     */
    constructor(containerSelector, contextId, options = {}) {
        this.containerSelector = containerSelector;
        this.contextId = contextId;
        this.options = options;
        this.threads = [];
        this.activeThreadId = null;

        this.init();
    }

    /**
     * Initialize component state and load threads.
     * @returns {Promise<void>}
     */
    async init() {
        const container = $(this.containerSelector);
        if (!container) return;

        this.container = container;
        this.container.innerHTML = `
            <div class="discussion-wrapper loading" style="padding:var(--space-4); text-align:center;">
                <div class="spinner-sm" style="display:inline-block; margin-bottom:var(--space-2);"></div>
                <p class="text-muted">Loading discussions...</p>
            </div>
        `;

        await this.loadThreads();
    }

    /**
     * Load discussion threads from service.
     * @returns {Promise<void>}
     */
    async loadThreads() {
        this.threads = await discussionService.getThreads(this.contextId);
        this.render();
    }

    /**
     * Render the discussion UI.
     * @returns {void}
     */
    render() {
        if (!this.container) return;
        const user = authService.getCurrentUser();

        let headerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-6);">
                <h3 style="font-size:var(--text-lg)"><i class="fa-regular fa-comments"></i> ${this.options.title || 'Discussion & Q&A'}</h3>
                ${user ? `<button class="btn btn-primary btn-sm" id="btn-new-thread"><i class="fa-solid fa-plus"></i> New Topic</button>` : ''}
            </div>
        `;

        let newThreadFormHtml = `
            <div id="new-thread-form" style="display:none; background:var(--bg-tertiary); padding:var(--space-4); border-radius:var(--radius-md); margin-bottom:var(--space-6);">
                <h4 style="margin-bottom:var(--space-3)">Start a new discussion</h4>
                <div class="input-group mb-3">
                    <input type="text" id="nt-title" class="input" placeholder="Discussion Title (e.g. Need help with flexbox)">
                </div>
                <div class="input-group mb-3">
                    <textarea id="nt-content" class="input textarea" rows="3" placeholder="Describe your question or insight..."></textarea>
                </div>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn btn-ghost btn-sm" id="btn-cancel-thread">Cancel</button>
                    <button class="btn btn-primary btn-sm" id="btn-submit-thread">Post</button>
                </div>
            </div>
        `;

        let threadsHtml = '';
        if (this.threads.length === 0) {
            threadsHtml = `
                <div style="text-align:center; padding:var(--space-8); background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-subtle);">
                    <i class="fa-regular fa-comments text-muted" style="font-size:2.5rem; margin-bottom:var(--space-3);"></i>
                    <p class="text-muted">No discussions yet. Take the initiative and start a new topic!</p>
                </div>
            `;
        } else {
            threadsHtml = this.threads.map(t => this._renderThreadCard(t)).join('');
        }

        this.container.innerHTML = `
            <div class="discussion-wrapper">
                ${headerHtml}
                ${user ? newThreadFormHtml : '<p class="text-muted text-sm" style="margin-bottom:var(--space-4); padding:var(--space-3); background:var(--bg-tertiary); border-radius:var(--radius-md);">Sign in to participate in the discussion.</p>'}
                <div class="threads-list" style="display:flex; flex-direction:column; gap:var(--space-4);">
                    ${threadsHtml}
                </div>
            </div>
        `;

        this._attachEvents();
    }

    /**
     * Render a single thread card.
     * @param {object} t
     * @returns {string}
     */
    _renderThreadCard(t) {
        const user = authService.getCurrentUser();
        
        let repliesHtml = '';
        if (t.replies && t.replies.length > 0) {
            repliesHtml = `
                <div style="margin-top:var(--space-4); padding-left:var(--space-4); border-left:2px solid var(--border-subtle);">
                    ${t.replies.map(r => `
                        <div style="margin-bottom:var(--space-3);">
                            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:4px;">
                                <span style="font-weight:600; font-size:0.85rem; color:${r.isInstructor ? 'var(--brand-primary-light)' : 'var(--text-primary)'};">
                                    ${r.authorName} ${r.isInstructor ? '<span class="badge badge-primary" style="font-size:0.6rem; padding:2px 4px; margin-left:4px;">Instructor</span>' : ''}
                                </span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(r.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div style="font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${r.content.replace(/\n/g, '<br>')}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="card" style="padding:var(--space-5);">
                <div style="display:flex; align-items:flex-start; gap:var(--space-4);">
                    <div class="avatar avatar-md" style="background:var(--brand-gradient); color:#fff; font-weight:600; flex-shrink:0;">
                        ${(t.authorName || 'A')[0].toUpperCase()}
                    </div>
                    <div style="flex:1;">
                        <h4 style="margin-bottom:4px; font-size:1.1rem; color:var(--text-primary);">${t.title}</h4>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:var(--space-3);">
                            Started by <span style="font-weight:600;">${t.authorName}</span> • ${new Date(t.createdAt).toLocaleDateString([], {month:'long', day:'numeric'})}
                        </div>
                        <div style="font-size:0.95rem; color:var(--text-secondary); line-height:1.6; margin-bottom:var(--space-4);">
                            ${t.content.replace(/\n/g, '<br>')}
                        </div>
                        
                        ${t.codeSnippet ? `
                            <div style="background:#1e1e1e; color:#d4d4d4; padding:var(--space-3); border-radius:var(--radius-md); font-family:monospace; font-size:0.85rem; overflow-x:auto; margin-bottom:var(--space-4); border:1px solid #333;">
                                <pre style="margin:0;">${t.codeSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                            </div>
                        ` : ''}

                        ${repliesHtml}

                        ${user ? `
                            <div style="margin-top:var(--space-4); display:flex; gap:10px;">
                                <input type="text" class="input reply-input" data-thread-id="${t.id}" placeholder="Write a reply..." style="flex:1; padding:6px 10px; font-size:0.9rem;">
                                <button class="btn btn-secondary btn-sm reply-btn" data-thread-id="${t.id}">Reply</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach UI event handlers.
     * @returns {void}
     */
    _attachEvents() {
        const btnNew = this.container.querySelector('#btn-new-thread');
        const formNew = this.container.querySelector('#new-thread-form');
        const btnCancel = this.container.querySelector('#btn-cancel-thread');
        const btnSubmit = this.container.querySelector('#btn-submit-thread');
        
        if (btnNew && formNew) {
            btnNew.addEventListener('click', () => {
                formNew.style.display = 'block';
                btnNew.style.display = 'none';
            });
        }

        if (btnCancel && formNew) {
            btnCancel.addEventListener('click', () => {
                formNew.style.display = 'none';
                btnNew.style.display = 'inline-block';
                this.container.querySelector('#nt-title').value = '';
                this.container.querySelector('#nt-content').value = '';
            });
        }

        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const title = this.container.querySelector('#nt-title').value.trim();
                const content = this.container.querySelector('#nt-content').value.trim();
                
                if (!title || !content) {
                    showToast('Title and content are required.', 'error');
                    return;
                }

                btnSubmit.disabled = true;
                btnSubmit.innerHTML = 'Posting...';

                const newThread = await discussionService.createThread(this.contextId, title, content);
                if (newThread) {
                    showToast('Discussion created!', 'success');
                    await this.loadThreads();
                } else {
                    showToast('Failed to create discussion.', 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = 'Post';
                }
            });
        }

        const replyBtns = this.container.querySelectorAll('.reply-btn');
        replyBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const threadId = btn.dataset.threadId;
                const input = this.container.querySelector(`.reply-input[data-thread-id="${threadId}"]`);
                const content = input.value.trim();

                if (!content) return;

                btn.disabled = true;
                btn.innerHTML = '...';

                const reply = await discussionService.addReply(threadId, content);
                if (reply) {
                    showToast('Reply posted!', 'success');
                    await this.loadThreads();
                } else {
                    showToast('Failed to post reply.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Reply';
                }
            });
        });
    }
}
