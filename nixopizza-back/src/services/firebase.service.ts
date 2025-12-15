import admin from 'firebase-admin';

let isInitialized = false;

const initialize = () => {
  if (isInitialized) return true;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.warn('Firebase credentials not configured. Push notifications disabled.');
    return false;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  isInitialized = true;
  return true;
};

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> => {
  if (!initialize()) return false;
  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
    };
    await admin.messaging().send(message);
    return true;
  } catch (err) {
    console.error('sendPushNotification error', err);
    return false;
  }
};
