// ============================================
// ProCode EduPulse — Rating Distribution Chart
// Feature #118: Course Reviews & Ratings
// ============================================

import { firestoreService } from '../services/firestore-service.js';
import { $ } from '../utils/dom.js';

/**
 * Rating distribution chart component.
 * Shows a visual breakdown of 1-5 star ratings.
 */
export class RatingDistributionChart {
    constructor(containerId, courseId) {
        this.containerId = containerId;
        this.courseId = courseId;
        this.distribution = null;

        this._init();
    }

    async _init() {
        this.distribution = await firestoreService.getRatingDistribution(this.courseId);
        this.render();
    }

    /**
     * Calculate percentage for a rating count.
     */
    getPercentage(count, total) {
        return total ? Math.round((count / total) * 100) : 0;
    }

    /**
     * Render the rating distribution chart.
     */
    render() {
        const container = $(this.containerId);
        if (!container || !this.distribution) return;

        const { 1: one, 2: two, 3: three, 4: four, 5: five, avg, total } = this.distribution;

        container.innerHTML = `
            <div class="rating-distribution">
                <!-- Average Rating Summary -->
                <div class="rating-summary">
                    <div class="average-rating">
                        <div class="average-number">${typeof avg === 'number' ? avg.toFixed(1) : '0'}</div>
                        <div class="average-stars">${this._renderStars(avg)}</div>
                        <div class="total-reviews">${total} reviews</div>
                    </div>
                </div>

                <!-- Rating Distribution Bars -->
                <div class="rating-bars">
                    ${[5, 4, 3, 2, 1].map(rating => this._renderRatingBar(rating, total)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render star visualization.
     */
    _renderStars(rating) {
        const fullRating = Math.round(rating);
        return '⭐'.repeat(fullRating) + '☆'.repeat(Math.max(0, 5 - fullRating));
    }

    /**
     * Render individual rating bar.
     */
    _renderRatingBar(rating, total) {
        const count = this.distribution[rating] || 0;
        const percentage = this.getPercentage(count, total);

        return `
            <div class="rating-bar-item">
                <div class="rating-label">
                    <span class="stars">${'⭐'.repeat(rating)}</span>
                    <span class="count">${count}</span>
                </div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%;" title="${count} reviews"></div>
                </div>
                <div class="percentage">${percentage}%</div>
            </div>
        `;
    }
}

/**
 * Render rating distribution chart.
 * @param {string} containerId
 * @param {string} courseId
 */
export async function renderRatingDistributionChart(containerId, courseId) {
    return new RatingDistributionChart(containerId, courseId);
}

/**
 * Quick rating display component (inline, small format).
 */
export class QuickRatingDisplay {
    constructor(containerId, courseId) {
        this.containerId = containerId;
        this.courseId = courseId;
        this.distribution = null;

        this._init();
    }

    async _init() {
        this.distribution = await firestoreService.getRatingDistribution(this.courseId);
        this.render();
    }

    render() {
        const container = $(this.containerId);
        if (!container || !this.distribution) return;

        const { avg, total } = this.distribution;
        const stars = this._renderStars(avg);

        container.innerHTML = `
            <div class="quick-rating">
                <div class="rating-stars">${stars}</div>
                <div class="rating-value">${typeof avg === 'number' ? avg.toFixed(1) : '0'}</div>
                <div class="rating-count">(${total})</div>
            </div>
        `;
    }

    _renderStars(rating) {
        const fullRating = Math.round(rating);
        return '⭐'.repeat(fullRating) + '☆'.repeat(Math.max(0, 5 - fullRating));
    }
}

/**
 * Render quick rating display.
 * @param {string} containerId
 * @param {string} courseId
 */
export async function renderQuickRatingDisplay(containerId, courseId) {
    return new QuickRatingDisplay(containerId, courseId);
}
