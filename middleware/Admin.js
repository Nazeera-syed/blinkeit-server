import UserModel from "../models/user.model.js";

export const admin = async (req, res, next) => {
  try {
    // ✅ use the same field name as in auth.js
    const userId = req.userId || req.uid; 

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - no user ID found in request",
        error: true,
        success: false,
      });
    }

    // ✅ if you store Firebase UID in a `uid` field, use findOne
    const user = await UserModel.findOne({ uid: userId });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Permission denied - admin access required",
        error: true,
        success: false,
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      message: "Server error while verifying admin",
      error: true,
      success: false,
    });
  }
};
