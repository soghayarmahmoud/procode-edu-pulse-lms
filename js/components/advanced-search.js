// ============================================
// ProCode EduPulse — Advanced Search Component
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';

export class AdvancedSearchComponent {
  constructor() {
    this.searchIndex = null;
    this.searchResults = [];
    this.filters = {
      query: '',
      type: 'all',
      category: 'all',
      difficulty: 'all',
      duration: 'all',
      language: 'all',
      tags: []
    };
    this.recentSearches = storage.getRecentSearches() || [];
    this.init();
  }

  async init() {
    await this.buildSearchIndex();
    this.render();
    this.setupEventListeners();
  }

  async buildSearchIndex() {
    // Mock search data - in real implementation, this would come from API
    this.searchIndex = {
      courses: [
        {
          id: 'html-basics',
          title: 'HTML Basics',
          description: 'Learn the fundamentals of HTML including tags, attributes, and semantic markup',
          type: 'course',
          category: 'web-development',
          difficulty: 'beginner',
          duration: '4 hours',
          language: 'html',
          tags: ['html', 'web', 'beginner', 'fundamentals'],
          content: 'HTML is the foundation of web development...',
          rating: 4.8,
          enrolled: 12500,
          lastUpdated: Date.now() - 7 * 24 * 60 * 60 * 1000
        },
        {
          id: 'css-fundamentals',
          title: 'CSS Fundamentals',
          description: 'Master CSS styling, layouts, and responsive design principles',
          type: 'course',
          category: 'web-development',
          difficulty: 'beginner',
          duration: '6 hours',
          language: 'css',
          tags: ['css', 'styling', 'responsive', 'design'],
          content: 'CSS allows you to style and layout web pages...',
          rating: 4.7,
          enrolled: 9800,
          lastUpdated: Date.now() - 5 * 24 * 60 * 60 * 1000
        },
        {
          id: 'javascript-core',
          title: 'JavaScript Core Concepts',
          description: 'Deep dive into JavaScript programming, from basics to advanced concepts',
          type: 'course',
          category: 'programming',
          difficulty: 'intermediate',
          duration: '12 hours',
          language: 'javascript',
          tags: ['javascript', 'programming', 'es6', 'async'],
          content: 'JavaScript is a versatile programming language...',
          rating: 4.9,
          enrolled: 15200,
          lastUpdated: Date.now() - 3 * 24 * 60 * 60 * 1000
        },
        {
          id: 'linux-essentials',
          title: 'Linux Essentials',
          description: 'Learn Linux command line, file system, and system administration',
          type: 'course',
          category: 'system-admin',
          difficulty: 'intermediate',
          duration: '8 hours',
          language: 'linux',
          tags: ['linux', 'command-line', 'system-admin', 'bash'],
          content: 'Linux is a powerful operating system...',
          rating: 4.6,
          enrolled: 7200,
          lastUpdated: Date.now() - 10 * 24 * 60 * 60 * 1000
        },
        {
          id: 'cpp-programming',
          title: 'C++ Programming',
          description: 'Learn C++ from basics to advanced programming concepts',
          type: 'course',
          category: 'programming',
          difficulty: 'advanced',
          duration: '16 hours',
          language: 'cpp',
          tags: ['cpp', 'programming', 'algorithms', 'performance'],
          content: 'C++ is a high-performance programming language...',
          rating: 4.5,
          enrolled: 5400,
          lastUpdated: Date.now() - 14 * 24 * 60 * 60 * 1000
        }
      ],
      lessons: [
        {
          id: 'html-semantic-tags',
          title: 'Semantic HTML Tags',
          description: 'Understanding and using semantic HTML5 tags for better accessibility',
          type: 'lesson',
          category: 'web-development',
          difficulty: 'beginner',
          duration: '45 minutes',
          language: 'html',
          tags: ['html', 'semantic', 'accessibility', 'html5'],
          content: 'Semantic HTML tags provide meaning to web content...',
          courseId: 'html-basics',
          rating: 4.7,
          views: 8900
        },
        {
          id: 'css-flexbox',
          title: 'CSS Flexbox Layout',
          description: 'Master flexible box layout for responsive web design',
          type: 'lesson',
          category: 'web-development',
          difficulty: 'intermediate',
          duration: '60 minutes',
          language: 'css',
          tags: ['css', 'flexbox', 'layout', 'responsive'],
          content: 'Flexbox provides a powerful way to create flexible layouts...',
          courseId: 'css-fundamentals',
          rating: 4.8,
          views: 12300
        },
        {
          id: 'js-async-programming',
          title: 'Asynchronous JavaScript',
          description: 'Understanding callbacks, promises, and async/await',
          type: 'lesson',
          category: 'programming',
          difficulty: 'advanced',
          duration: '90 minutes',
          language: 'javascript',
          tags: ['javascript', 'async', 'promises', 'callbacks'],
          content: 'Asynchronous programming is essential for modern JavaScript...',
          courseId: 'javascript-core',
          rating: 4.9,
          views: 15600
        }
      ],
      challenges: [
        {
          id: 'html-form-builder',
          title: 'HTML Form Builder',
          description: 'Create a complex form with validation and accessibility features',
          type: 'challenge',
          category: 'web-development',
          difficulty: 'intermediate',
          duration: '2 hours',
          language: 'html',
          tags: ['html', 'forms', 'validation', 'accessibility'],
          content: 'Build a comprehensive contact form...',
          rating: 4.6,
          completed: 3400,
          successRate: 78
        },
        {
          id: 'css-animation-gallery',
          title: 'CSS Animation Gallery',
          description: 'Create an impressive gallery with CSS animations and transitions',
          type: 'challenge',
          category: 'web-development',
          difficulty: 'advanced',
          duration: '3 hours',
          language: 'css',
          tags: ['css', 'animations', 'transitions', 'gallery'],
          content: 'Design and implement an animated image gallery...',
          rating: 4.8,
          completed: 2100,
          successRate: 65
        },
        {
          id: 'js-todo-app',
          title: 'JavaScript Todo App',
          description: 'Build a fully functional todo application with local storage',
          type: 'challenge',
          category: 'programming',
          difficulty: 'beginner',
          duration: '4 hours',
          language: 'javascript',
          tags: ['javascript', 'dom', 'local-storage', 'app'],
          content: 'Create a complete todo application from scratch...',
          rating: 4.7,
          completed: 5600,
          successRate: 82
        }
      ],
      discussions: [
        {
          id: 'best-practices-html',
          title: 'HTML Best Practices Discussion',
          description: 'Community discussion about HTML best practices and standards',
          type: 'discussion',
          category: 'web-development',
          difficulty: 'all',
          duration: 'ongoing',
          language: 'html',
          tags: ['html', 'best-practices', 'standards', 'discussion'],
          content: 'Share your thoughts on HTML best practices...',
          replies: 156,
          views: 8900,
          lastActivity: Date.now() - 2 * 60 * 60 * 1000
        }
      ]
    };
  }

  render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="advanced-search-page">
        <div class="container">
          <div class="search-header">
            <h1 class="page-title">Advanced Search</h1>
            <p class="page-description">Find courses, lessons, challenges, and discussions</p>
          </div>

          <div class="search-main">
            <div class="search-input-section">
              <div class="search-input-wrapper">
                <i class="fa-solid fa-search search-icon"></i>
                <input 
                  type="text" 
                  class="search-input" 
                  id="search-input"
                  placeholder="Search for courses, lessons, challenges..."
                  value="${this.filters.query}"
                  autocomplete="off"
                >
                <button class="search-clear-btn" id="search-clear-btn" style="display: ${this.filters.query ? 'block' : 'none'}">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div class="search-suggestions" id="search-suggestions" style="display: none;">
                <div class="suggestions-header">Suggestions</div>
                <div class="suggestions-list" id="suggestions-list"></div>
              </div>
            </div>

            <div class="search-filters-section">
              <div class="filters-header">
                <h3>Filters</h3>
                <button class="filters-toggle" id="filters-toggle">
                  <i class="fa-solid fa-sliders"></i>
                </button>
              </div>
              
              <div class="filters-content" id="filters-content">
                <div class="filter-group">
                  <label for="type-filter">Type</label>
                  <select id="type-filter">
                    <option value="all">All Types</option>
                    <option value="course">Courses</option>
                    <option value="lesson">Lessons</option>
                    <option value="challenge">Challenges</option>
                    <option value="discussion">Discussions</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label for="category-filter">Category</label>
                  <select id="category-filter">
                    <option value="all">All Categories</option>
                    <option value="web-development">Web Development</option>
                    <option value="programming">Programming</option>
                    <option value="system-admin">System Administration</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label for="difficulty-filter">Difficulty</label>
                  <select id="difficulty-filter">
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label for="duration-filter">Duration</label>
                  <select id="duration-filter">
                    <option value="all">Any Duration</option>
                    <option value="short">Under 1 hour</option>
                    <option value="medium">1-4 hours</option>
                    <option value="long">4+ hours</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label for="language-filter">Language</label>
                  <select id="language-filter">
                    <option value="all">All Languages</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                    <option value="linux">Linux</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label>Popular Tags</label>
                  <div class="tags-filter">
                    ${this.renderPopularTags()}
                  </div>
                </div>

                <div class="filter-actions">
                  <button class="apply-filters-btn" id="apply-filters-btn">
                    <i class="fa-solid fa-check"></i> Apply Filters
                  </button>
                  <button class="clear-filters-btn" id="clear-filters-btn">
                    <i class="fa-solid fa-times"></i> Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="search-results-section">
            <div class="results-header">
              <div class="results-info">
                <h2>Search Results</h2>
                <span class="results-count" id="results-count">
                  ${this.searchResults.length} results found
                </span>
              </div>
              
              <div class="results-controls">
                <div class="sort-controls">
                  <label for="sort-select">Sort by:</label>
                  <select id="sort-select">
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
                
                <div class="view-controls">
                  <button class="view-btn active" data-view="list">
                    <i class="fa-solid fa-list"></i>
                  </button>
                  <button class="view-btn" data-view="grid">
                    <i class="fa-solid fa-th"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="results-content" id="results-content">
              ${this.renderSearchResults()}
            </div>

            ${this.searchResults.length > 0 ? `
              <div class="pagination" id="pagination">
                ${this.renderPagination()}
              </div>
            ` : ''}
          </div>

          ${this.recentSearches.length > 0 ? `
            <div class="recent-searches-section">
              <h3>Recent Searches</h3>
              <div class="recent-searches-list">
                ${this.renderRecentSearches()}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderPopularTags() {
    const popularTags = [
      'html', 'css', 'javascript', 'responsive', 'async', 'linux', 'cpp', 
      'beginner', 'intermediate', 'advanced', 'web-development', 'programming'
    ];

    return popularTags.map(tag => `
      <label class="tag-checkbox">
        <input type="checkbox" value="${tag}" class="tag-input">
        <span class="tag-label">${tag}</span>
      </label>
    `).join('');
  }

  renderSearchResults() {
    if (this.searchResults.length === 0) {
      return `
        <div class="no-results">
          <i class="fa-solid fa-search"></i>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or filters</p>
          <div class="search-tips">
            <h4>Search Tips:</h4>
            <ul>
              <li>Use specific keywords instead of general terms</li>
              <li>Try different spellings or synonyms</li>
              <li>Use filters to narrow down results</li>
              <li>Search for specific technologies or concepts</li>
            </ul>
          </div>
        </div>
      `;
    }

    return `
      <div class="results-list" id="results-list">
        ${this.searchResults.map(result => this.renderResultItem(result)).join('')}
      </div>
    `;
  }

  renderResultItem(result) {
    const typeIcon = {
      course: 'fa-solid fa-graduation-cap',
      lesson: 'fa-solid fa-book-open',
      challenge: 'fa-solid fa-code',
      discussion: 'fa-solid fa-comments'
    };

    const difficultyColor = {
      beginner: 'var(--color-success)',
      intermediate: 'var(--color-warning)',
      advanced: 'var(--color-error)',
      all: 'var(--text-secondary)'
    };

    return `
      <div class="result-item" data-type="${result.type}">
        <div class="result-icon">
          <i class="${typeIcon[result.type]}"></i>
        </div>
        
        <div class="result-content">
          <div class="result-header">
            <h3 class="result-title">
              <a href="#/${result.type === 'course' ? 'course' : result.type === 'lesson' ? 'lesson' : result.type}/${result.id}">
                ${this.highlightSearchTerm(result.title)}
              </a>
            </h3>
            <div class="result-meta">
              <span class="result-type">${result.type}</span>
              <span class="result-difficulty" style="color: ${difficultyColor[result.difficulty]}">
                ${result.difficulty}
              </span>
              <span class="result-duration">${result.duration}</span>
            </div>
          </div>
          
          <p class="result-description">
            ${this.highlightSearchTerm(result.description)}
          </p>
          
          <div class="result-tags">
            ${result.tags.slice(0, 5).map(tag => `
              <span class="result-tag">${tag}</span>
            `).join('')}
          </div>
          
          <div class="result-stats">
            ${result.rating ? `
              <div class="result-rating">
                <i class="fa-solid fa-star"></i>
                <span>${result.rating}</span>
              </div>
            ` : ''}
            
            ${result.enrolled ? `
              <div class="result-enrolled">
                <i class="fa-solid fa-users"></i>
                <span>${result.enrolled.toLocaleString()} enrolled</span>
              </div>
            ` : ''}
            
            ${result.views ? `
              <div class="result-views">
                <i class="fa-solid fa-eye"></i>
                <span>${result.views.toLocaleString()} views</span>
              </div>
            ` : ''}
            
            ${result.completed ? `
              <div class="result-completed">
                <i class="fa-solid fa-check"></i>
                <span>${result.completed.toLocaleString()} completed</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="result-actions">
          <button class="result-action-btn primary">
            ${result.type === 'course' ? 'Enroll' : result.type === 'lesson' ? 'Start' : result.type === 'challenge' ? 'Try' : 'Join'}
          </button>
          <button class="result-action-btn secondary">
            <i class="fa-solid fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;
  }

  highlightSearchTerm(text) {
    if (!this.filters.query) return text;
    
    const regex = new RegExp(`(${this.filters.query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  renderRecentSearches() {
    return this.recentSearches.slice(0, 5).map(search => `
      <div class="recent-search-item" data-query="${search}">
        <i class="fa-solid fa-clock"></i>
        <span>${search}</span>
        <button class="remove-search-btn">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  renderPagination() {
    const totalPages = Math.ceil(this.searchResults.length / 10);
    const currentPage = 1;
    
    let pagination = '<div class="pagination-controls">';
    
    // Previous button
    if (currentPage > 1) {
      pagination += `<button class="pagination-btn prev"><i class="fa-solid fa-chevron-left"></i></button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const activeClass = i === currentPage ? 'active' : '';
      pagination += `<button class="pagination-btn ${activeClass}">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
      pagination += `<button class="pagination-btn next"><i class="fa-solid fa-chevron-right"></i></button>`;
    }
    
    pagination += '</div>';
    return pagination;
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const filtersToggle = document.getElementById('filters-toggle');
    const filtersContent = document.getElementById('filters-content');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const sortSelect = document.getElementById('sort-select');

    // Search input events
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.query = e.target.value;
        this.updateClearButton();
        this.showSuggestions();
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });

      searchInput.addEventListener('focus', () => {
        if (this.filters.query) {
          this.showSuggestions();
        }
      });
    }

    // Clear button
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Filters toggle
    if (filtersToggle) {
      filtersToggle.addEventListener('click', () => {
        filtersContent.classList.toggle('collapsed');
      });
    }

    // Filter controls
    document.getElementById('type-filter')?.addEventListener('change', (e) => {
      this.filters.type = e.target.value;
    });

    document.getElementById('category-filter')?.addEventListener('change', (e) => {
      this.filters.category = e.target.value;
    });

    document.getElementById('difficulty-filter')?.addEventListener('change', (e) => {
      this.filters.difficulty = e.target.value;
    });

    document.getElementById('duration-filter')?.addEventListener('change', (e) => {
      this.filters.duration = e.target.value;
    });

    document.getElementById('language-filter')?.addEventListener('change', (e) => {
      this.filters.language = e.target.value;
    });

    // Tag checkboxes
    document.querySelectorAll('.tag-input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedTags();
      });
    });

    // Filter actions
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Sort control
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortResults(e.target.value);
      });
    }

    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchView(e.target.closest('.view-btn').dataset.view);
      });
    });

    // Recent searches
    document.querySelectorAll('.recent-search-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-search-btn')) {
          this.setSearchQuery(item.dataset.query);
        }
      });

      item.querySelector('.remove-search-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeRecentSearch(item.dataset.query);
      });
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-section')) {
        this.hideSuggestions();
      }
    });
  }

  updateClearButton() {
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
      clearBtn.style.display = this.filters.query ? 'block' : 'none';
    }
  }

  showSuggestions() {
    if (!this.filters.query) {
      this.hideSuggestions();
      return;
    }

    const suggestions = this.generateSuggestions();
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsContainer = document.getElementById('search-suggestions');

    if (suggestions.length > 0 && suggestionsList) {
      suggestionsList.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-query="${suggestion.query}">
          <i class="fa-solid fa-search"></i>
          <span>${this.highlightSearchTerm(suggestion.text)}</span>
          <span class="suggestion-type">${suggestion.type}</span>
        </div>
      `).join('');

      suggestionsContainer.style.display = 'block';

      // Add click handlers to suggestions
      suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          this.setSearchQuery(item.dataset.query);
        });
      });
    } else {
      this.hideSuggestions();
    }
  }

  hideSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }

  generateSuggestions() {
    const suggestions = [];
    const query = this.filters.query.toLowerCase();

    // Search through all content
    Object.values(this.searchIndex).flat().forEach(item => {
      if (item.title.toLowerCase().includes(query) || 
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))) {
        suggestions.push({
          query: item.title,
          text: item.title,
          type: item.type
        });
      }
    });

    // Limit to 5 suggestions
    return suggestions.slice(0, 5);
  }

  setSearchQuery(query) {
    this.filters.query = query;
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = query;
    }
    this.updateClearButton();
    this.performSearch();
  }

  clearSearch() {
    this.filters.query = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    this.updateClearButton();
    this.hideSuggestions();
    this.performSearch();
  }

  updateSelectedTags() {
    const selectedTags = [];
    document.querySelectorAll('.tag-input:checked').forEach(checkbox => {
      selectedTags.push(checkbox.value);
    });
    this.filters.tags = selectedTags;
  }

  applyFilters() {
    this.performSearch();
    showToast('Filters applied', 'success');
  }

  clearAllFilters() {
    this.filters = {
      query: this.filters.query,
      type: 'all',
      category: 'all',
      difficulty: 'all',
      duration: 'all',
      language: 'all',
      tags: []
    };

    // Reset form controls
    document.getElementById('type-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('difficulty-filter').value = 'all';
    document.getElementById('duration-filter').value = 'all';
    document.getElementById('language-filter').value = 'all';

    document.querySelectorAll('.tag-input').forEach(checkbox => {
      checkbox.checked = false;
    });

    this.performSearch();
    showToast('Filters cleared', 'info');
  }

  performSearch() {
    // Add to recent searches
    if (this.filters.query && !this.recentSearches.includes(this.filters.query)) {
      this.recentSearches.unshift(this.filters.query);
      this.recentSearches = this.recentSearches.slice(0, 10);
      storage.saveRecentSearches(this.recentSearches);
    }

    // Perform search
    this.searchResults = this.searchContent();
    this.updateResultsDisplay();
    this.hideSuggestions();
  }

  searchContent() {
    const allContent = Object.values(this.searchIndex).flat();
    let results = [];

    allContent.forEach(item => {
      let matches = true;
      let score = 0;

      // Text search
      if (this.filters.query) {
        const query = this.filters.query.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descriptionMatch = item.description.toLowerCase().includes(query);
        const contentMatch = item.content.toLowerCase().includes(query);
        const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(query));

        if (titleMatch || descriptionMatch || contentMatch || tagMatch) {
          score += titleMatch ? 10 : 0;
          score += descriptionMatch ? 5 : 0;
          score += contentMatch ? 3 : 0;
          score += tagMatch ? 2 : 0;
        } else {
          matches = false;
        }
      }

      // Type filter
      if (this.filters.type !== 'all' && item.type !== this.filters.type) {
        matches = false;
      }

      // Category filter
      if (this.filters.category !== 'all' && item.category !== this.filters.category) {
        matches = false;
      }

      // Difficulty filter
      if (this.filters.difficulty !== 'all' && item.difficulty !== this.filters.difficulty) {
        matches = false;
      }

      // Language filter
      if (this.filters.language !== 'all' && item.language !== this.filters.language) {
        matches = false;
      }

      // Tags filter
      if (this.filters.tags.length > 0) {
        const hasMatchingTag = this.filters.tags.some(tag => 
          item.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          matches = false;
        }
      }

      if (matches) {
        results.push({ ...item, searchScore: score });
      }
    });

    // Sort by relevance (default)
    results.sort((a, b) => b.searchScore - a.searchScore);

    return results;
  }

  sortResults(sortBy) {
    switch (sortBy) {
      case 'rating':
        this.searchResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
        this.searchResults.sort((a, b) => {
          const aPop = (a.enrolled || a.views || a.completed || 0);
          const bPop = (b.enrolled || b.views || b.completed || 0);
          return bPop - aPop;
        });
        break;
      case 'newest':
        this.searchResults.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
        break;
      case 'duration':
        this.searchResults.sort((a, b) => {
          const getDurationMinutes = (duration) => {
            if (duration.includes('hour')) {
              return parseInt(duration) * 60;
            } else if (duration.includes('minute')) {
              return parseInt(duration);
            }
            return 0;
          };
          return getDurationMinutes(a.duration) - getDurationMinutes(b.duration);
        });
        break;
      default: // relevance
        this.searchResults.sort((a, b) => b.searchScore - a.searchScore);
    }

    this.updateResultsDisplay();
  }

  switchView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    const resultsList = document.getElementById('results-list');
    if (resultsList) {
      resultsList.className = view === 'grid' ? 'results-grid' : 'results-list';
    }
  }

  updateResultsDisplay() {
    const resultsCount = document.getElementById('results-count');
    const resultsContent = document.getElementById('results-content');

    if (resultsCount) {
      resultsCount.textContent = `${this.searchResults.length} results found`;
    }

    if (resultsContent) {
      resultsContent.innerHTML = this.renderSearchResults();
    }

    // Update pagination
    const pagination = document.getElementById('pagination');
    if (pagination) {
      pagination.innerHTML = this.renderPagination();
    }
  }

  removeRecentSearch(query) {
    this.recentSearches = this.recentSearches.filter(search => search !== query);
    storage.saveRecentSearches(this.recentSearches);
    
    // Re-render recent searches
    const recentSearchesList = document.querySelector('.recent-searches-list');
    if (recentSearchesList) {
      recentSearchesList.innerHTML = this.renderRecentSearches();
    }
  }
}

// Export for use in router
export function renderAdvancedSearch() {
  const search = new AdvancedSearchComponent();
  return search;
}
