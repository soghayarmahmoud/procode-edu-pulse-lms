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

    // ══════════════════════════════════════════════
    // SUBSCRIPTION MANAGEMENT
    // ══════════════════════════════════════════════

    /**
     * Create a subscription checkout session.
     * @param {string} tier - Subscription tier ('monthly' or 'annual')
     * @param {object} tierData - Subscription tier details
     * @returns {Promise<object>} Stripe checkout session data
     */
    async createSubscriptionCheckout(tier, tierData) {
        if (!this.stripe) {
            throw new Error('Stripe not initialized');
        }

        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in to subscribe');
        }

        try {
            // Create subscription checkout session via backend
            const response = await fetch('/api/create-subscription-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({
                    tier,
                    tierData,
                    successUrl: `${window.location.origin}/#/subscription-success?tier=${tier}`,
                    cancelUrl: `${window.location.origin}/#/pricing`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create subscription checkout');
            }

            const session = await response.json();
            return session;
        } catch (error) {
            console.error('Error creating subscription checkout:', error);
            throw error;
        }
    }

    /**
     * Handle successful subscription completion.
     * @param {string} tier - Subscription tier
     * @param {string} sessionId - Stripe session ID
     * @returns {Promise<boolean>} Success status
     */
    async handleSubscriptionSuccess(tier, sessionId) {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            // Verify subscription with backend
            const response = await fetch('/api/verify-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({ tier, sessionId })
            });

            if (!response.ok) {
                throw new Error('Subscription verification failed');
            }

            const result = await response.json();

            if (result.success) {
                // Record subscription in Firestore
                await this.recordSubscription(user.uid, tier, result.subscriptionId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error handling subscription success:', error);
            throw error;
        }
    }

    /**
     * Record a subscription in Firestore.
     * @param {string} userId - User ID
     * @param {string} tier - Subscription tier
     * @param {string} subscriptionId - Stripe subscription ID
     * @returns {Promise<void>}
     */
    async recordSubscription(userId, tier, subscriptionId) {
        try {
            const subscriptionData = {
                userId,
                tier,
                subscriptionId,
                status: 'active',
                startDate: new Date(),
                renewalDate: this._calculateRenewalDate(tier)
            };

            // Add to user's subscriptions collection
            await firestoreService.addDocument(`users/${userId}/subscriptions`, subscriptionData);

            // Update user's subscription status
            const userDoc = await firestoreService.getDocument('users', userId);
            const subscriptions = userDoc.subscriptions || [];
            subscriptions.push(subscriptionData);

            await firestoreService.updateDocument('users', userId, {
                subscriptions,
                subscriptionStatus: 'active',
                subscriptionTier: tier,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error recording subscription:', error);
            throw error;
        }
    }

    /**
     * Calculate renewal date based on tier.
     * @param {string} tier - Subscription tier
     * @returns {Date} Renewal date
     * @private
     */
    _calculateRenewalDate(tier) {
        const now = new Date();
        if (tier === 'annual') {
            now.setFullYear(now.getFullYear() + 1);
        } else {
            now.setMonth(now.getMonth() + 1);
        }
        return now;
    }

    /**
     * Check if user has active subscription.
     * @param {string} userId - User ID
     * @returns {Promise<object|null>} Subscription data or null
     */
    async getActiveSubscription(userId) {
        try {
            const userDoc = await firestoreService.getDocument('users', userId);
            if (userDoc.subscriptionStatus === 'active' && userDoc.subscriptions) {
                return userDoc.subscriptions.find(sub => sub.status === 'active') || null;
            }
            return null;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return null;
        }
    }

    /**
     * Cancel user subscription.
     * @param {string} userId - User ID
     * @param {string} subscriptionId - Stripe subscription ID
     * @returns {Promise<boolean>} Success status
     */
    async cancelSubscription(userId, subscriptionId) {
        try {
            // Cancel via Stripe (would need backend endpoint)
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await authService.getCurrentUser().getIdToken()}`
                },
                body: JSON.stringify({ subscriptionId })
            });

            if (response.ok) {
                // Update local status
                const userDoc = await firestoreService.getDocument('users', userId);
                if (userDoc.subscriptions) {
                    const subIndex = userDoc.subscriptions.findIndex(sub => sub.subscriptionId === subscriptionId);
                    if (subIndex >= 0) {
                        userDoc.subscriptions[subIndex].status = 'cancelled';
                        userDoc.subscriptions[subIndex].cancelledAt = new Date();
                        await firestoreService.updateDocument('users', userId, {
                            subscriptions: userDoc.subscriptions,
                            subscriptionStatus: 'cancelled',
                            updatedAt: new Date()
                        });
                    }
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            return false;
        }
    }

    // ══════════════════════════════════════════════
    // CERTIFICATE GENERATION
    // ══════════════════════════════════════════════

    /**
     * Generate certificate for course completion.
     * @param {string} userId - User ID
     * @param {string} courseId - Course ID
     * @returns {Promise<string>} Certificate URL or data
     */
    async generateCertificate(userId, courseId) {
        try {
            const user = await firestoreService.getDocument('users', userId);
            const course = coursesData.find(c => c.id === courseId);

            if (!user || !course) {
                throw new Error('User or course not found');
            }

            // Certificate data
            const certificateData = {
                studentName: user.name || user.displayName || 'Student',
                courseName: course.title,
                completionDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                certificateId: `CERT-${userId}-${courseId}-${Date.now()}`,
                instructorName: 'ProCode EduPulse Team'
            };

            // Generate PDF (would use pdf-lib in production)
            const pdfData = await this._generatePDFCertificate(certificateData);

            // Store certificate in Firestore
            const certRecord = {
                userId,
                courseId,
                certificateData,
                generatedAt: new Date(),
                pdfUrl: pdfData.url // Would be uploaded to storage
            };

            await firestoreService.addDocument(`users/${userId}/certificates`, certRecord);

            return pdfData.url;
        } catch (error) {
            console.error('Error generating certificate:', error);
            throw error;
        }
    }

    /**
     * Generate PDF certificate (placeholder - would use pdf-lib).
     * @param {object} data - Certificate data
     * @returns {Promise<object>} PDF data
     * @private
     */
    async _generatePDFCertificate(data) {
        // In production, this would use pdf-lib to generate a real PDF
        // For now, return a placeholder
        console.log('Generating certificate for:', data);

        // Simulate PDF generation
        return {
            url: `data:application/pdf;base64,${btoa('Certificate PDF placeholder')}`,
            data: data
        };
    }

    // ══════════════════════════════════════════════
    // LIVE SESSIONS & MENTORSHIP
    // ══════════════════════════════════════════════

    /**
     * Book a mentorship session.
     * @param {string} mentorId - Mentor user ID
     * @param {Date} dateTime - Session date and time
     * @param {string} topic - Session topic
     * @returns {Promise<object>} Booking data
     */
    async bookMentorshipSession(mentorId, dateTime, topic) {
        const user = authService.getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in');
        }

        try {
            const bookingData = {
                studentId: user.uid,
                mentorId,
                dateTime,
                topic,
                status: 'pending',
                bookedAt: new Date(),
                meetingLink: null // Would be generated by video service
            };

            const bookingId = await firestoreService.addDocument('mentorship_bookings', bookingData);
            return { ...bookingData, id: bookingId };
        } catch (error) {
            console.error('Error booking mentorship session:', error);
            throw error;
        }
    }

    /**
     * Get available mentorship slots.
     * @param {string} mentorId - Mentor user ID
     * @returns {Promise<Array>} Available time slots
     */
    async getMentorshipSlots(mentorId) {
        try {
            // In production, this would query mentor's availability
            // For now, return sample slots
            const now = new Date();
            const slots = [];

            for (let i = 1; i <= 7; i++) {
                const date = new Date(now);
                date.setDate(now.getDate() + i);
                slots.push({
                    date: date.toISOString().split('T')[0],
                    times: ['09:00', '10:00', '14:00', '15:00', '16:00']
                });
            }

            return slots;
        } catch (error) {
            console.error('Error getting mentorship slots:', error);
            return [];
        }
    }

    /**
     * Get user's mentorship bookings.
     * @param {string} userId - User ID
     * @returns {Promise<Array>} User's bookings
     */
    async getUserMentorshipBookings(userId) {
        try {
            const bookings = await firestoreService.getCollectionWhere('mentorship_bookings',
                ['studentId', '==', userId]);
            return bookings;
        } catch (error) {
            console.error('Error getting mentorship bookings:', error);
            return [];
        }
    }
}

// Export singleton instance
export const paymentService = new PaymentService();