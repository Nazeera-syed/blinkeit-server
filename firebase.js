import admin from "firebase-admin";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables");
}

const serviceAccount = JSON.parse(serviceAccountKey);

// 🔧 Fix: convert literal "\\n" into real newlines
if (serviceAccount.private_key.includes("\\n")) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
