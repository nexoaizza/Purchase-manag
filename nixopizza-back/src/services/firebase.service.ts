import admin from "firebase-admin";

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.warn('Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
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
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
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
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'order_assignments',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error.message);
    // If token is invalid, we could remove it from the user
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('FCM token is invalid or expired');
    }
    return false;
  }
};
