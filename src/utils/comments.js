// src/utils/comments.js
import { discussionService } from '../../js/services/discussion-service.js';
import { showToast } from '../../js/utils/dom.js';
import { formatCommentTime } from './helpers.js';
import DOMPurify from 'dompurify';

export function initLessonComments(lessonId) {
  const list = document.getElementById('lesson-comments-list');
  const input = document.getElementById('lesson-comment-input');
  const postBtn = document.getElementById('lesson-comment-post');
  const limit = document.getElementById('lesson-comment-limit');
  const count = document.getElementById('lesson-comment-count');

  if (!list || !input || !postBtn || !limit || !count) return;

  const renderList = (comments) => {
    const sorted = [...(comments || [])].sort((a, b) => b.createdAt - a.createdAt);
    count.textContent = `${sorted.length} comment${sorted.length === 1 ? '' : 's'}`;
    if (sorted.length === 0) {
      list.innerHTML = '<p class="text-muted text-sm" style="padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-md);">Be the first to comment.</p>';
      return;
    }

    list.innerHTML = sorted.map(c => {
      const initial = (c.authorName || 'Student').charAt(0).toUpperCase();
      return `
        <div style="display:flex;gap:var(--space-3);padding:var(--space-4) 0;border-bottom:1px solid var(--border-subtle);">
        <div class="user-avatar-sm">${initial}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-3);">
          <strong style="font-size:0.95rem;">${c.authorName || 'Student'}</strong>
          <span class="text-xs text-muted">${formatCommentTime(c.createdAt)}</span>
          </div>
          <p style="margin:6px 0 0;color:var(--text-secondary);white-space:pre-wrap;">${DOMPurify.sanitize(c.content)}</p>
        </div>
        </div>
      `;
    }).join('');
  };

  if (window.__lessonCommentsUnsub) window.__lessonCommentsUnsub();
  window.__lessonCommentsUnsub = discussionService.subscribeLessonComments(lessonId, renderList);

  const updateCounter = () => {
    limit.textContent = `${input.value.length}/500`;
  };
  updateCounter();
  input.addEventListener('input', updateCounter);

  postBtn.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return showToast('Comment cannot be empty.', 'error');
    if (value.length > 500) return showToast('Comment exceeds 500 characters.', 'error');

    postBtn.disabled = true;
    const ok = await discussionService.addLessonComment(lessonId, value);
    if (ok) {
      input.value = '';
      updateCounter();
    } else {
      showToast('Failed to post comment.', 'error');
    }
    postBtn.disabled = false;
  });
}