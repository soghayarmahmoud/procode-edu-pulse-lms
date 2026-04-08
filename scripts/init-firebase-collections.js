// scripts/init-firebase-collections.js
import { db, isFirebaseConfigured } from '../js/services/firebase-config.js';
import {
    doc, setDoc, collection, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

async function initFirebaseCollections() {
    if (!isFirebaseConfigured()) {
        console.log('Firebase not configured, skipping initialization');
        return;
    }

    try {
        console.log('Initializing Firebase collections...');

        // Initialize system/settings
        const settingsRef = doc(db, 'system', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
            await setDoc(settingsRef, {
                subscriptionPricing: {
                    basic: { price: 9.99, features: ['Access to basic courses', 'Community support'] },
                    pro: { price: 19.99, features: ['All courses', 'Priority support', 'Certificates'] },
                    premium: { price: 49.99, features: ['All courses', '1-on-1 mentoring', 'Job placement assistance'] }
                },
                promotionalBanner: {
                    active: false,
                    text: '',
                    color: '#FF6B6B',
                    url: ''
                },
                maintenanceMode: false,
                platformName: 'ProCode',
                updatedAt: new Date()
            });
            console.log('Created system/settings');
        }

        // Initialize system/analytics
        const analyticsRef = doc(db, 'system', 'analytics');
        const analyticsSnap = await getDoc(analyticsRef);
        if (!analyticsSnap.exists()) {
            await setDoc(analyticsRef, {
                totalUsers: 0,
                activeUsers: 0,
                instructors: 0,
                totalCourses: 0,
                totalEnrollments: 0,
                totalRevenue: 0,
                platformGrowth: {
                    newUsersThisMonth: 0,
                    enrollmentGrowthRate: 0
                },
                updatedAt: new Date()
            });
            console.log('Created system/analytics');
        }

        console.log('Firebase collections initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase collections:', error);
    }
}

// Run if called directly
if (typeof window !== 'undefined' && window.location) {
    initFirebaseCollections();
}

export { initFirebaseCollections };