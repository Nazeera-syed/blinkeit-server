import express from "express";
import jwt from "jsonwebtoken";
import admin from "../firebase.js"; // Firebase Admin SDK
import UserModel from "../models/user.model.js";


// LOGIN
export async function loginusercontroller(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID Token required" });

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    const firebaseUid = decoded.uid;

    if (!phone) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    // ✅ Find user by firebaseUid
    let user = await UserModel.findOne({ uid: firebaseUid });

     // ✅ Step 2: If not found, check if the phone already exists
    if (!user) {
      user = await UserModel.findOne({ mobile: phone });

       if (user) {
        // Link Firebase UID to this existing user
        user.uid = firebaseUid;
        await user.save();
      } else {
        user = await UserModel.create({
        uid: firebaseUid,
        mobile: phone,
      
        status: "Active",
      });
    }
  }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Contact Admin" });
    }

    return res.json({
      success: true,
      message: "Login successful",
     data: {
    _id: user._id,
    uid: user.uid,
    name: user.name,
    email: user.email || "",
    mobile: user.mobile || "",
    status: user.status,
  },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// LOGOUT
export async function logoutController(req, res) {
  try {
    const firebaseUid = req.userId; // set by middleware
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Not really needed since we don’t use refresh tokens
    // But you could just confirm logout
    return res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// UPDATE USER
export async function updateUserDetails(req, res) {
  try {
    const firebaseUid = req.userId; // from auth middleware
    const { name, email,mobile} = req.body;

    if (!name && !email && !mobile) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { uid: firebaseUid },   // 🔑 match by firebase UID
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(mobile && { mobile }),
      },
      { new: true } // return updated doc
    ).select("-refresh_token");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
// GET USER DETAILS
export async function userDetails(req, res) {
  try {
    const firebaseUid = req.userId; // from middleware

    console.log("Firebase UID:", firebaseUid);

    const user = await UserModel.findOne({ uid: firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.json({
      message: "User details",
      data: user,
      success: true,
    });
  } catch (error) {
    console.error("User details error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
}
