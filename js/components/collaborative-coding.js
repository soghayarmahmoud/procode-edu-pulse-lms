// ============================================
// ProCode EduPulse — Collaborative Coding Component
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { authService } from '../services/auth-service.js';

export class CollaborativeCodingComponent {
  constructor() {
    this.currentUser = authService.getCurrentUser();
    this.activeSession = null;
    this.sessions = [];
    this.peerConnections = {};
    this.localStream = null;
    this.init();
  }

  async init() {
    await this.loadSessions();
    this.render();
    this.setupEventListeners();
  }

  async loadSessions() {
    // Mock data for collaborative sessions
    this.sessions = [
      {
        id: 'session-1',
        title: 'JavaScript DOM Manipulation Practice',
        description: 'Work together on building interactive web components',
        language: 'javascript',
        difficulty: 'intermediate',
        participants: [
          { id: 'user1', name: 'Alex Chen', avatar: 'AC', status: 'online' },
          { id: 'user2', name: 'Sarah Kim', avatar: 'SK', status: 'online' }
        ],
        maxParticipants: 4,
        createdAt: Date.now() - 30 * 60 * 1000,
        code: `// Collaborative JavaScript session\n// Add your code here!\n\nfunction createInteractiveButton() {\n  // Your code here\n}`,
        isActive: true
      },
      {
        id: 'session-2',
        title: 'CSS Grid Layout Challenge',
        description: 'Create responsive layouts together',
        language: 'css',
        difficulty: 'beginner',
        participants: [
          { id: 'user3', name: 'Mike Johnson', avatar: 'MJ', status: 'online' }
        ],
        maxParticipants: 3,
        createdAt: Date.now() - 15 * 60 * 1000,
        code: `/* Collaborative CSS session\n/* Build a responsive grid layout */\n\n.container {\n  display: grid;\n  /* Your code here */\n}`,
        isActive: true
      },
      {
        id: 'session-3',
        title: 'HTML Form Validation',
        description: 'Build accessible and validated forms',
        language: 'html',
        difficulty: 'beginner',
        participants: [],
        maxParticipants: 4,
        createdAt: Date.now() - 5 * 60 * 1000,
        code: `<!-- Collaborative HTML session -->\n<!-- Create a validated form -->\n\n<form>\n  <!-- Your code here -->\n</form>`,
        isActive: true
      }
    ];
  }

  render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="collaborative-coding-page">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">Collaborative Coding</h1>
            <p class="page-description">Code together with other learners in real-time</p>
            <button class="create-session-btn" onclick="collaborativeCoding.showCreateSessionModal()">
              <i class="fa-solid fa-plus"></i> Create New Session
            </button>
          </div>

          <div class="sessions-filters">
            <div class="filter-tabs">
              <button class="filter-tab active" data-filter="all">All Sessions</button>
              <button class="filter-tab" data-filter="active">Active</button>
              <button class="filter-tab" data-filter="my-sessions">My Sessions</button>
            </div>
            
            <div class="filter-controls">
              <select class="language-filter">
                <option value="">All Languages</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="javascript">JavaScript</option>
              </select>
              
              <select class="difficulty-filter">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div class="sessions-grid">
            ${this.renderSessionCards()}
          </div>

          <div class="collaboration-features">
            <h2>Collaboration Features</h2>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fa-solid fa-users"></i>
                </div>
                <h3>Real-time Collaboration</h3>
                <p>Code together with multiple users in real-time with live synchronization</p>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fa-solid fa-video"></i>
                </div>
                <h3>Video Chat</h3>
                <p>Built-in video calling for face-to-face collaboration and discussion</p>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fa-solid fa-comments"></i>
                </div>
                <h3>Live Chat</h3>
                <p>Instant messaging to discuss code and share ideas with your partners</p>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fa-solid fa-code-branch"></i>
                </div>
                <h3>Code History</h3>
                <p>Track changes and revert to previous versions with version control</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSessionCards() {
    return this.sessions.map(session => this.renderSessionCard(session)).join('');
  }

  renderSessionCard(session) {
    const participantCount = session.participants.length;
    const isFull = participantCount >= session.maxParticipants;
    const canJoin = !isFull && session.isActive;
    
    return `
      <div class="session-card" data-session-id="${session.id}">
        <div class="session-header">
          <div class="session-language">
            <i class="fa-solid fa-code"></i>
            ${session.language.toUpperCase()}
          </div>
          <div class="session-difficulty ${session.difficulty}">
            ${session.difficulty}
          </div>
          ${session.isActive ? '<div class="session-status active">Active</div>' : '<div class="session-status">Inactive</div>'}
        </div>
        
        <h3 class="session-title">${session.title}</h3>
        <p class="session-description">${session.description}</p>
        
        <div class="session-participants">
          <div class="participants-avatars">
            ${session.participants.slice(0, 3).map(p => `
              <div class="participant-avatar" title="${p.name}">
                ${p.avatar}
              </div>
            `).join('')}
            ${participantCount > 3 ? `
              <div class="participant-avatar more">
                +${participantCount - 3}
              </div>
            ` : ''}
          </div>
          <span class="participants-count">${participantCount}/${session.maxParticipants} participants</span>
        </div>
        
        <div class="session-time">
          <i class="fa-solid fa-clock"></i>
          Started ${this.formatTime(session.createdAt)}
        </div>
        
        <div class="session-actions">
          ${canJoin ? `
            <button class="join-session-btn" onclick="collaborativeCoding.joinSession('${session.id}')">
              <i class="fa-solid fa-sign-in-alt"></i> Join Session
            </button>
          ` : isFull ? `
            <button class="session-full-btn" disabled>
              <i class="fa-solid fa-users"></i> Session Full
            </button>
          ` : `
            <button class="join-session-btn" disabled>
              <i class="fa-solid fa-lock"></i> Session Inactive
            </button>
          `}
          
          <button class="watch-session-btn" onclick="collaborativeCoding.watchSession('${session.id}')">
            <i class="fa-solid fa-eye"></i> Watch
          </button>
        </div>
      </div>
    `;
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  setupEventListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.filterSessions(e.target.dataset.filter);
      });
    });

    // Language and difficulty filters
    document.querySelector('.language-filter')?.addEventListener('change', () => this.applyFilters());
    document.querySelector('.difficulty-filter')?.addEventListener('change', () => this.applyFilters());
  }

  filterSessions(filter) {
    let filtered = [...this.sessions];
    
    switch (filter) {
      case 'active':
        filtered = filtered.filter(s => s.isActive);
        break;
      case 'my-sessions':
        filtered = filtered.filter(s => 
          s.participants.some(p => p.id === this.currentUser?.uid)
        );
        break;
    }
    
    this.renderFilteredSessions(filtered);
  }

  applyFilters() {
    const languageFilter = document.querySelector('.language-filter')?.value || '';
    const difficultyFilter = document.querySelector('.difficulty-filter')?.value || '';
    
    let filtered = [...this.sessions];
    
    if (languageFilter) {
      filtered = filtered.filter(s => s.language === languageFilter);
    }
    
    if (difficultyFilter) {
      filtered = filtered.filter(s => s.difficulty === difficultyFilter);
    }
    
    this.renderFilteredSessions(filtered);
  }

  renderFilteredSessions(sessions) {
    const grid = document.querySelector('.sessions-grid');
    if (!grid) return;
    
    if (sessions.length === 0) {
      grid.innerHTML = `
        <div class="no-sessions">
          <i class="fa-solid fa-search"></i>
          <h3>No sessions found</h3>
          <p>Try adjusting your filters or create a new session</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = sessions.map(session => this.renderSessionCard(session)).join('');
  }

  showCreateSessionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create Collaborative Session</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        
        <form class="create-session-form" onsubmit="collaborativeCoding.createSession(event)">
          <div class="form-group">
            <label for="session-title">Session Title</label>
            <input type="text" id="session-title" required placeholder="e.g., JavaScript Array Methods Practice">
          </div>
          
          <div class="form-group">
            <label for="session-description">Description</label>
            <textarea id="session-description" required placeholder="What will you work on together?"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="session-language">Language</label>
              <select id="session-language" required>
                <option value="">Select Language</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="session-difficulty">Difficulty</label>
              <select id="session-difficulty" required>
                <option value="">Select Level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="max-participants">Max Participants</label>
            <input type="number" id="max-participants" min="2" max="6" value="4" required>
          </div>
          
          <div class="form-group">
            <label for="initial-code">Initial Code (Optional)</label>
            <textarea id="initial-code" placeholder="Start with some boilerplate code..." rows="8"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              <i class="fa-solid fa-rocket"></i> Create Session
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  async createSession(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const sessionData = {
      id: `session-${Date.now()}`,
      title: document.getElementById('session-title').value,
      description: document.getElementById('session-description').value,
      language: document.getElementById('session-language').value,
      difficulty: document.getElementById('session-difficulty').value,
      maxParticipants: parseInt(document.getElementById('max-participants').value),
      code: document.getElementById('initial-code').value || this.getDefaultCode(document.getElementById('session-language').value),
      participants: [{
        id: this.currentUser?.uid || 'anonymous',
        name: this.currentUser?.displayName || 'Anonymous',
        avatar: (this.currentUser?.displayName || 'A').charAt(0).toUpperCase(),
        status: 'online',
        isHost: true
      }],
      createdAt: Date.now(),
      isActive: true,
      host: this.currentUser?.uid || 'anonymous'
    };
    
    this.sessions.unshift(sessionData);
    document.querySelector('.modal-overlay')?.remove();
    this.render();
    this.setupEventListeners();
    
    showToast('Session created successfully!', 'success');
    
    // Auto-join the created session
    setTimeout(() => this.joinSession(sessionData.id), 500);
  }

  getDefaultCode(language) {
    const defaults = {
      html: `<!-- Collaborative HTML Session -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Collaborative Project</title>\n</head>\n<body>\n  <!-- Your code here -->\n</body>\n</html>`,
      css: `/* Collaborative CSS Session */\n/* Your styles here */\n\n.container {\n  /* Your code here */\n}`,
      javascript: `// Collaborative JavaScript Session\n// Your code here\n\nfunction collaborativeFunction() {\n  // Your code here\n}`
    };
    
    return defaults[language] || '// Start coding together!';
  }

  async joinSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // Check if session is full
    if (session.participants.length >= session.maxParticipants) {
      showToast('Session is full', 'error');
      return;
    }
    
    // Add current user to participants
    if (!session.participants.some(p => p.id === this.currentUser?.uid)) {
      session.participants.push({
        id: this.currentUser?.uid || 'anonymous',
        name: this.currentUser?.displayName || 'Anonymous',
        avatar: (this.currentUser?.displayName || 'A').charAt(0).toUpperCase(),
        status: 'online'
      });
    }
    
    this.activeSession = session;
    this.renderCollaborativeEditor();
    showToast(`Joined "${session.title}"`, 'success');
  }

  watchSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    this.activeSession = session;
    this.renderCollaborativeEditor(true);
    showToast(`Watching "${session.title}"`, 'info');
  }

  renderCollaborativeEditor(readOnly = false) {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="collaborative-editor">
        <div class="editor-header">
          <div class="session-info">
            <h2>${this.activeSession.title}</h2>
            <div class="session-meta">
              <span class="language-badge">${this.activeSession.language.toUpperCase()}</span>
              <span class="participant-count">
                <i class="fa-solid fa-users"></i>
                ${this.activeSession.participants.length}/${this.activeSession.maxParticipants}
              </span>
            </div>
          </div>
          
          <div class="editor-actions">
            <button class="video-chat-btn" onclick="collaborativeCoding.startVideoChat()">
              <i class="fa-solid fa-video"></i> Video Chat
            </button>
            <button class="chat-toggle-btn" onclick="collaborativeCoding.toggleChat()">
              <i class="fa-solid fa-comments"></i> Chat
            </button>
            <button class="leave-session-btn" onclick="collaborativeCoding.leaveSession()">
              <i class="fa-solid fa-sign-out-alt"></i> Leave
            </button>
          </div>
        </div>
        
        <div class="editor-container">
          <div class="code-panel">
            <div class="participants-bar">
              ${this.activeSession.participants.map(p => `
                <div class="participant-indicator" title="${p.name}">
                  <div class="participant-avatar-small">${p.avatar}</div>
                  <div class="status-dot ${p.status}"></div>
                </div>
              `).join('')}
            </div>
            
            <div class="code-editor" id="collaborative-code-editor">
              <textarea ${readOnly ? 'readonly' : ''} class="code-textarea">${this.activeSession.code}</textarea>
            </div>
          </div>
          
          <div class="side-panel" id="side-panel">
            <div class="chat-panel" id="chat-panel">
              <div class="chat-header">
                <h3>Session Chat</h3>
              </div>
              <div class="chat-messages" id="chat-messages">
                <div class="system-message">
                  Welcome to the collaborative session!
                </div>
              </div>
              <div class="chat-input">
                <input type="text" placeholder="Type your message..." id="chat-input">
                <button onclick="collaborativeCoding.sendMessage()">
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupCollaborativeFeatures();
  }

  setupCollaborativeFeatures() {
    // Code editor synchronization (mock implementation)
    const codeEditor = document.querySelector('.code-textarea');
    if (codeEditor) {
      codeEditor.addEventListener('input', () => {
        this.broadcastCodeChange(codeEditor.value);
      });
    }
    
    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  }

  broadcastCodeChange(code) {
    // In a real implementation, this would send code changes to other participants
    // For now, just update the local session
    if (this.activeSession) {
      this.activeSession.code = code;
    }
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    
    if (!input || !messagesContainer) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <div class="message-author">${this.currentUser?.displayName || 'Anonymous'}</div>
      <div class="message-content">${message}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';
    
    // In a real implementation, this would broadcast the message to other participants
  }

  toggleChat() {
    const sidePanel = document.getElementById('side-panel');
    if (sidePanel) {
      sidePanel.classList.toggle('collapsed');
    }
  }

  startVideoChat() {
    showToast('Video chat feature coming soon!', 'info');
    // In a real implementation, this would initialize WebRTC video chat
  }

  leaveSession() {
    if (!this.activeSession) return;
    
    // Remove user from participants
    if (this.activeSession.participants) {
      this.activeSession.participants = this.activeSession.participants.filter(
        p => p.id !== this.currentUser?.uid
      );
    }
    
    this.activeSession = null;
    this.render();
    this.setupEventListeners();
    showToast('Left the session', 'info');
  }
}

// Global instance for event handlers
window.collaborativeCoding = null;

// Export for use in router
export function renderCollaborativeCoding() {
  window.collaborativeCoding = new CollaborativeCodingComponent();
  return window.collaborativeCoding.init();
}
