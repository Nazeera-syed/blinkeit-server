// middleware/auth.js
import admin from "../firebase.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or malformed." });
    }

    const idToken = authHeader.split(" ")[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Store the user ID (uid) from the decoded token for use in subsequent middleware/routes
    req.userId = decodedToken.uid;
     req.user = decodedToken;

    next();
  } catch (error) {
    // If verification fails, the token is invalid, expired, or something else is wrong
    console.error("Error verifying Firebase ID token:", error);
    return res.status(403).json({ message: "Unauthorized. Invalid or expired token." });
  }
};

export default auth;