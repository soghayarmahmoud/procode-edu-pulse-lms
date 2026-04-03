// ============================================
// ProCode EduPulse — Payment Service
// ============================================
// Handles payment processing, shopping cart, and purchase management
// Integrates with Stripe for secure payment processing

import { authService } from './auth-service.js';
import { firestoreService } from './firestore-service.js';

/**
 * Payment service for handling course purchases and Stripe integration.
 * This service manages the entire payment flow from cart to completion.
 */
class PaymentService {
    constructor() {
        // Initialize Stripe (will be loaded dynamically)
        this.stripe = null;
        this.stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

        // Initialize service
        this._initStripe();
    }

    /**
     * Initialize Stripe.js with publishable key.
     * @private
     */
    async _initStripe() {
        if (!this.stripePublishableKey) {
            console.warn('Stripe publishable key not configured');
            return;
        }

        try {
            // Load Stripe.js dynamically
            if (!window.Stripe) {
                await this._loadStripeScript();
            }
            this.stripe = window.Stripe(this.stripePublishableKey);
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    }

    /**
     * Load Stripe.js script dynamically.
     * @private
     * @returns {Promise<void>}
     */
    _loadStripeScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create a payment session for course purchase.
     * @param {string} courseId - The ID of the course to purchase
     * @param {object} courseData - Course information including pricing
     * @returns {Promise<object>} Stripe checkout session data
     */
    async createCheckoutSession(courseId, courseData) {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }

        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in to purchase');
        }

        try {
            // Create checkout session via backend (you'll need to implement this endpoint)
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({
                    courseId,
                    courseTitle: courseData.title,
                    price: courseData.pricing.price,
                    currency: 'usd',
                    successUrl: `${window.location.origin}/#/payment-success?course=${courseId}`,
                    cancelUrl: `${window.location.origin}/#/courses`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();
            return session;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }

    /**
     * Redirect to Stripe Checkout.
     * @param {string} sessionId - Stripe checkout session ID
     */
    async redirectToCheckout(sessionId) {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }

        try {
            const result = await this.stripe.redirectToCheckout({ sessionId });
            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Error redirecting to checkout:', error);
            throw error;
        }
    }

    /**
     * Handle successful payment completion.
     * @param {string} courseId - The purchased course ID
     * @param {string} sessionId - Stripe session ID for verification
     * @returns {Promise<boolean>} Success status
     */
    async handlePaymentSuccess(courseId, sessionId) {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            // Verify payment with backend
            const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({ courseId, sessionId })
            });

            if (!response.ok) {
                throw new Error('Payment verification failed');
            }

            const result = await response.json();

            if (result.success) {
                // Record purchase in Firestore
                await this.recordPurchase(user.uid, courseId, result.transactionId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error handling payment success:', error);
            throw error;
        }
    }

    /**
     * Record a course purchase in Firestore.
     * @param {string} userId - User ID
     * @param {string} courseId - Course ID
     * @param {string} transactionId - Payment transaction ID
     * @returns {Promise<void>}
     */
    async recordPurchase(userId, courseId, transactionId) {
        try {
            const purchaseData = {
                userId,
                courseId,
                transactionId,
                purchaseDate: new Date(),
                status: 'completed'
            };

            // Add to user's purchases collection
            await firestoreService.addDocument(`users/${userId}/purchases`, purchaseData);

            // Update user's purchased courses
            const userDoc = await firestoreService.getDocument('users', userId);
            const purchasedCourses = userDoc.purchasedCourses || [];
            if (!purchasedCourses.includes(courseId)) {
                purchasedCourses.push(courseId);
                await firestoreService.updateDocument('users', userId, {
                    purchasedCourses,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('Error recording purchase:', error);
            throw error;
        }
    }

    /**
     * Check if user has purchased a course.
     * @param {string} userId - User ID
     * @param {string} courseId - Course ID
     * @returns {Promise<boolean>} Whether user has purchased the course
     */
    async hasPurchasedCourse(userId, courseId) {
        try {
            const userDoc = await firestoreService.getDocument('users', userId);
            const purchasedCourses = userDoc.purchasedCourses || [];
            return purchasedCourses.includes(courseId);
        } catch (error) {
            console.error('Error checking purchase status:', error);
            return false;
        }
    }

    /**
     * Get user's purchase history.
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of purchase records
     */
    async getPurchaseHistory(userId) {
        try {
            const purchases = await firestoreService.getCollection(`users/${userId}/purchases`);
            return purchases;
        } catch (error) {
            console.error('Error getting purchase history:', error);
            return [];
        }
    }

    /**
     * Calculate total revenue for instructor.
     * @param {string} instructorId - Instructor user ID
     * @returns {Promise<number>} Total revenue in USD
     */
    async getInstructorRevenue(instructorId) {
        try {
            // This would require a backend aggregation or cloud function
            // For now, return 0 as placeholder
            console.warn('Instructor revenue calculation requires backend implementation');
            return 0;
        } catch (error) {
            console.error('Error calculating instructor revenue:', error);
            return 0;
        }
    }
}

// Export singleton instance
export const paymentService = new PaymentService();