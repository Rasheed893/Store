const admin = require("firebase-admin");
// const serviceAccount = require("./online-store-ca4c8-firebase-adminsdk-fbsvc-1cc0beadee.json"); // Path to your downloaded key

// Throw clear error if env vars missing
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Missing FIREBASE_PRIVATE_KEY environment variable");
}
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Export the Firebase storage bucket
const bucket = admin.storage().bucket();
module.exports = bucket;
