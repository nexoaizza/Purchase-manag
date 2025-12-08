"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let isInitialized = false;
const initialize = () => {
    if (isInitialized)
        return true;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn('Firebase credentials not configured. Push notifications disabled.');
        return false;
    }
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
    });
    isInitialized = true;
    return true;
};
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!initialize())
        return false;
    try {
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data,
        };
        await firebase_admin_1.default.messaging().send(message);
        return true;
    }
    catch (err) {
        console.error('sendPushNotification error', err);
        return false;
    }
};
exports.sendPushNotification = sendPushNotification;
//# sourceMappingURL=firebase.service.js.map