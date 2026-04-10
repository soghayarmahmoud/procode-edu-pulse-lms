// ============================================
// ProCode EduPulse — Course Reviews Component
// Feature #118: Global Public Course Reviews & Ratings Engine
// ============================================

import { firestoreService } from '../services/firestore-service.js';
import { authService } from '../services/auth-service.js';
import { $ } from '../utils/dom.js';

/**
 * Course Reviews component for displaying paginated, filterable reviews.
 */
export class CourseReviewsComponent {
    constructor(containerId, courseId) {
        this.containerId = containerId;
        this.courseId = courseId;
        this.currentPage = 1;
        this.pageSize = 5;
        this.selectedRating = 0; // 0 = all ratings
        this.sortBy = 'recent'; // 'recent', 'rating', 'helpful'
        this.allReviews = [];
        this.currentUser = null;
        this.userEnrollments = null;

        this._init();
    }

    async _init() {
        this.currentUser = authService.getUser();
        if (this.currentUser?.uid) {
            const profile = await this._getUserProfile();
            this.userEnrollments = profile?.enrollments || {};
        }
        await this.loadReviews();
        this.render();
    }

    async _getUserProfile() {
        if (!this.currentUser?.uid) return null;
        const profile = localStorage.getItem('procode_profile');
        return profile ? JSON.parse(profile) : null;
    }

    /**
     * Load reviews from Firestore.
     */
    async loadReviews() {
        const options = {
            limit: 100, // Load all for client-side filtering
            sortBy: this.sortBy,
            minRating: this.selectedRating > 0 ? this.selectedRating : 0
        };
        const result = await firestoreService.getCourseReviewsPaginated(
            this.courseId,
            options
        );
        this.allReviews = result.reviews || [];
    }

    /**
     * Get paginated reviews for current page.
     */
    getPaginatedReviews() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.allReviews.slice(start, end);
    }

    /**
     * Get total pages based on filtered reviews.
     */
    getTotalPages() {
        return Math.ceil(this.allReviews.length / this.pageSize);
    }

    /**
     * Check if user is enrolled in the course (can write reviews).
     */
    isUserEnrolled() {
        if (!this.currentUser?.uid || !this.userEnrollments) return false;
        return this.userEnrollments[this.courseId] !== undefined;
    }

    /**
     * Render the reviews component.
     */
    render() {
        const container = $(this.containerId);
        if (!container) return;

        const totalPages = this.getTotalPages();
        const reviews = this.getPaginatedReviews();

        container.innerHTML = `
            <div class="course-reviews-section">
                <!-- Header -->
                <div class="reviews-header">
                    <h3>Student Reviews</h3>
                    <div class="reviews-actions">
                        ${this.isUserEnrolled() ? `
                            <button class="btn btn-primary btn-sm" id="write-review-btn">
                                Write a Review
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Filters -->
                <div class="reviews-filters">
                    <div class="filter-group">
                        <label>Filter by Rating:</label>
                        <div class="rating-filter">
                            <button class="filter-btn ${this.selectedRating === 0 ? 'active' : ''}" data-rating="0">All</button>
                            <button class="filter-btn ${this.selectedRating === 5 ? 'active' : ''}" data-rating="5">⭐ 5</button>
                            <button class="filter-btn ${this.selectedRating === 4 ? 'active' : ''}" data-rating="4">⭐ 4</button>
                            <button class="filter-btn ${this.selectedRating === 3 ? 'active' : ''}" data-rating="3">⭐ 3</button>
                            <button class="filter-btn ${this.selectedRating === 2 ? 'active' : ''}" data-rating="2">⭐ 2</button>
                            <button class="filter-btn ${this.selectedRating === 1 ? 'active' : ''}" data-rating="1">⭐ 1</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Sort by:</label>
                        <select id="sort-select" class="sort-select">
                            <option value="recent" ${this.sortBy === 'recent' ? 'selected' : ''}>Most Recent</option>
                            <option value="rating" ${this.sortBy === 'rating' ? 'selected' : ''}>Highest Rated</option>
                            <option value="helpful" ${this.sortBy === 'helpful' ? 'selected' : ''}>Most Helpful</option>
                        </select>
                    </div>
                </div>

                <!-- Reviews List -->
                <div class="reviews-list">
                    ${reviews.length > 0 ? reviews.map(review => this._renderReview(review)).join('') : '<p class="no-reviews">No reviews yet. Be the first to review!</p>'}
                </div>

                <!-- Pagination -->
                ${totalPages > 1 ? `
                    <div class="reviews-pagination">
                        <button class="btn-pagination btn-prev" ${this.currentPage === 1 ? 'disabled' : ''}>← Previous</button>
                        <span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>
                        <button class="btn-pagination btn-next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next →</button>
                    </div>
                ` : ''}
            </div>
        `;

        this._attachEventListeners();
    }

    /**
     * Render individual review item.
     */
    _renderReview(review) {
        const rating = review.rating || 0;
        const stars = '⭐'.repeat(Math.round(rating));
        const createdAt = review.createdAt 
            ? new Date(review.createdAt.seconds ? review.createdAt.seconds * 1000 : review.createdAt)
                .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Recently';

        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">
                        <strong>${review.authorName || 'Anonymous'}</strong>
                        <span class="review-date">${createdAt}</span>
                    </div>
                    <div class="review-rating">${stars} ${rating.toFixed(1)}</div>
                </div>
                <h4 class="review-title">${review.title || 'Untitled'}</h4>
                <p class="review-text">${review.text || ''}</p>
                <div class="review-footer">
                    <button class="btn-helpful" data-review-id="${review.id}" data-help-type="helpful">
                        👍 Helpful${review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ''}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners.
     */
    _attachEventListeners() {
        const container = $(this.containerId);
        if (!container) return;

        // Rating filters
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.selectedRating = parseInt(e.target.dataset.rating);
                this.currentPage = 1;
                await this.loadReviews();
                this.render();
            });
        });

        // Sort dropdown
        const sortSelect = $('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', async (e) => {
                this.sortBy = e.target.value;
                this.currentPage = 1;
                await this.loadReviews();
                this.render();
            });
        }

        // Pagination
        const prevBtn = container.querySelector('.btn-prev');
        const nextBtn = container.querySelector('.btn-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = this.getTotalPages();
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        // Helpful buttons
        container.querySelectorAll('.btn-helpful').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reviewId = btn.dataset.reviewId;
                await firestoreService.updateReviewHelpful(this.courseId, reviewId, 1);
                await this.loadReviews();
                this.render();
            });
        });

        // Write review button
        const writeReviewBtn = container.querySelector('#write-review-btn');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => {
                this._openReviewModal();
            });
        }
    }

    /**
     * Open modal to write a new review.
     */
    _openReviewModal() {
        if (!this.currentUser?.uid) {
            alert('Please log in to write a review.');
            return;
        }

        if (!this.isUserEnrolled()) {
            alert('Please enroll in this course to write a review.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Write a Review</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="review-form">
                    <div class="form-group">
                        <label>Rating (1-5 stars):</label>
                        <div class="star-input">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <input type="radio" name="rating" value="${i}" id="star-${i}">
                                <label for="star-${i}" class="star-label">⭐</label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="review-title">Title:</label>
                        <input type="text" id="review-title" name="title" required placeholder="e.g., Great course!">
                    </div>

                    <div class="form-group">
                        <label for="review-text">Review:</label>
                        <textarea id="review-text" name="text" required placeholder="Share your experience..." rows="4"></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-review">Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Review</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for modal
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-review').addEventListener('click', () => modal.remove());

        modal.querySelector('#review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this._submitReview(new FormData(e.target), modal);
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Submit a new review.
     */
    async _submitReview(formData, modal) {
        const rating = parseInt(formData.get('rating'));
        const title = formData.get('title');
        const text = formData.get('text');

        if (!rating || !title || !text) {
            alert('Please fill in all fields.');
            return;
        }

        const reviewData = {
            id: `${this.currentUser.uid}_${Date.now()}`,
            courseId: this.courseId,
            userId: this.currentUser.uid,
            authorName: this.currentUser.displayName || 'Anonymous',
            rating,
            title,
            text,
            helpfulCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await firestoreService.saveReview(this.courseId, reviewData);
        modal.remove();
        await this.loadReviews();
        this.render();
        alert('Review submitted successfully!');
    }
}

/**
 * Render course reviews on a page element.
 * @param {string} containerId
 * @param {string} courseId
 */
export async function renderCourseReviews(containerId, courseId) {
    return new CourseReviewsComponent(containerId, courseId);
}
