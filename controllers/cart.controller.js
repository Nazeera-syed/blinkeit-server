import CartProductModel from '../models/cartproduct.model.js';
import UserModel from '../models/user.model.js';

// -----------------------------
// ADD ITEM TO CART
// -----------------------------
export const addToCartItemController = async (req, res) => {
  try {
    const firebaseUid = req.userId; // from auth middleware
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Provide productId",
        error: true,
        success: false,
      });
    }

    // ✅ Find MongoDB user by Firebase UID
    const user = await UserModel.findOne({ uid: firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // ✅ Check if item already in cart
    const existingItem = await CartProductModel.findOne({
      userId: user._id,
      productId,
    });

    if (existingItem) {
      return res.status(400).json({ message: "Item already in cart", success: false });
    }

    // ✅ Add new cart item
    const cartItem = new CartProductModel({
      userId: user._id,
      productId,
      quantity: 1,
    });
    const saved = await cartItem.save();

    // ✅ Optionally update user's shopping_cart array
    await UserModel.updateOne({ uid: firebaseUid }, { $push: { shopping_cart:   productId} });

    return res.json({
      data: saved,
      message: "Item added successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// -----------------------------
// GET CART ITEMS
// -----------------------------
export const getCartItemController = async (req, res) => {
  try {
    const firebaseUid = req.userId;
    const user = await UserModel.findOne({ uid: firebaseUid });
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    const cartItem = await CartProductModel.find({ userId: user._id }).populate("productId");

    return res.json({
      data: cartItem,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// -----------------------------
// UPDATE CART ITEM QUANTITY
// -----------------------------
export const updateCartItemQtyController = async (req, res) => {
  try {
    const firebaseUid = req.userId;
    const { cartId, qty } = req.body;

    if (!cartId || typeof qty !== "number") {
      return res.status(400).json({ message: "Provide cartId and qty (number)", success: false });
    }

    const user = await UserModel.findOne({ uid: firebaseUid });
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    // Remove item if qty <= 0
    if (qty <= 0) {
      await CartProductModel.deleteOne({ _id: cartId, userId: user._id });
      return res.json({ success: true, message: "Item removed from cart" });
    }

    const updatedCart = await CartProductModel.findOneAndUpdate(
      { _id: cartId, userId: user._id },
      { $set: { quantity: qty } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ message: "Cart item not found", success: false });
    }

    return res.json({
      success: true,
      message: "Cart item updated",
      data: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------
// DELETE CART ITEM
// -----------------------------
export const deleteCartItemQtyController = async (req, res) => {
  try {
    const firebaseUid = req.userId;
    const { cartId } = req.body;

    if (!cartId) return res.status(400).json({ message: "Provide cartId", success: false });

    const user = await UserModel.findOne({ uid: firebaseUid });
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    const deleted = await CartProductModel.deleteOne({ _id: cartId, userId: user._id });

    return res.json({
      success: true,
      message: "Item removed from cart",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
