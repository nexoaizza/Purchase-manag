"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    if (firebase_admin_1.default.apps.length === 0) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            console.warn('Firebase credentials not configured. Push notifications disabled.');
            return false;
        }
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized');
    }
    return true;
};
// Initialize on module load
const isFirebaseInitialized = initializeFirebase();
/**
 * Send push notification to a specific device
 */
const sendPushNotification = async (fcmToken, title, body, data) => {
    if (!isFirebaseInitialized) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return false;
    }
    try {
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'order_assignments',
                },
            },
        };
        const response = await firebase_admin_1.default.messaging().send(message);
        console.log('Push notification sent successfully:', response);
        return true;
    }
    catch (error) {
        console.error('Error sending push notification:', error.message);
        // If token is invalid, we could remove it from the user
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('FCM token is invalid or expired');
        }
        return false;
    }
};
exports.sendPushNotification = sendPushNotification;
//# sourceMappingURL=firebase.service.js.map