// ============================================
// ProCode EduPulse — Timestamped Notes
// ============================================

import { $, showToast, formatTime } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { getCurrentPlayer } from './video-player.js';

export class NotesComponent {
    constructor(container, lessonId) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.lessonId = lessonId;
        this.render();
    }

    render() {
        const notes = storage.getNotes(this.lessonId);

        this.container.innerHTML = `
      <div class="notes-panel">
        <div class="notes-header">
          <div class="notes-title">📝 My Notes</div>
          <span class="badge badge-primary">${notes.length} notes</span>
        </div>
        
        <div class="notes-list" id="notes-list">
          ${notes.length === 0 ? `
            <div class="empty-state" style="padding:var(--space-8) var(--space-4)">
              <div class="empty-state-icon">📝</div>
              <div class="empty-state-title">No notes yet</div>
              <div class="empty-state-text">Add a note while watching the video. It will be linked to the current timestamp!</div>
            </div>
          ` : notes.map(note => this._renderNote(note)).join('')}
        </div>
        
        <div class="notes-add-form">
          <input type="text" class="input" id="note-input" placeholder="Add a note at current timestamp..." maxlength="500">
          <button class="btn btn-primary btn-sm" id="add-note-btn">Add</button>
        </div>
      </div>
    `;

        this._attachEvents();
    }

    _renderNote(note) {
        return `
      <div class="note-item" data-note-id="${note.id}">
        <span class="note-timestamp" data-time="${note.timestamp}" title="Click to jump to this time">
          ${formatTime(note.timestamp)}
        </span>
        <span class="note-content">${note.text}</span>
        <button class="note-delete" data-note-id="${note.id}" title="Delete note">✕</button>
      </div>
    `;
    }

    _attachEvents() {
        // Add note
        const addBtn = $('#add-note-btn', this.container);
        const input = $('#note-input', this.container);

        const addNote = () => {
            const text = input.value.trim();
            if (!text) return;

            const player = getCurrentPlayer();
            const timestamp = player ? player.getCurrentTime() : 0;

            storage.addNote(this.lessonId, timestamp, text);
            input.value = '';
            this.render();
            showToast('Note added!', 'success');
        };

        addBtn.addEventListener('click', addNote);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addNote();
        });

        // Click timestamp to seek
        this.container.querySelectorAll('.note-timestamp').forEach(ts => {
            ts.addEventListener('click', () => {
                const time = parseFloat(ts.dataset.time);
                const player = getCurrentPlayer();
                if (player) {
                    player.seekTo(time);
                    player.play();
                }
            });
        });

        // Delete note
        this.container.querySelectorAll('.note-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                storage.deleteNote(this.lessonId, btn.dataset.noteId);
                this.render();
                showToast('Note deleted', 'info');
            });
        });
    }
}
