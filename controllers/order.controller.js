import OrderModel from '../models/order.model.js'
import UserModel from '../models/user.model.js'
import mongoose from "mongoose";
import CartProductModel from "../models/cartproduct.model.js";
import Stripe from '../config/stripe.js';

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const firebaseUid = request.userId; // from auth middleware  
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body

        const payload = list_items.map(el => {
            return ({
                userId: firebaseUid,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name,
                    image: el.productId.image
                },
                paymentId: "",
                payment_status: "CASH ON DELIVERY",
                delivery_address: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
            })
        })
        const generatedOrder = await OrderModel.insertMany(payload)

        ///remove from the cart
        const user = await UserModel.findOne({ uid: firebaseUid });
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        const removeCartItems = await CartProductModel.deleteMany({ userId: user._id })
        const updateInUser = await UserModel.updateOne({ uid: firebaseUid }, { shopping_cart: [] })



        return response.json({
            message: "Order successfully",
            error: false,
            success: true,
            data: generatedOrder
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const pricewithDiscount = (price, dis = 1) => {
    const discountAmout = Math.ceil((Number(price) * Number(dis)) / 100)
    const actualPrice = Number(price) - Number(discountAmout)
    return actualPrice
}

export async function paymentController(request, response) {
    try {
        const firebaseUid = request.userId; // from auth middleware   
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body

        const user = await UserModel.findOne({ uid: firebaseUid })

        const line_items = list_items.map(item => {
            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.productId.name,
                        images: item.productId.image,
                        metadata: {
                            productId: item.productId._id
                        }
                    },
                    unit_amount: pricewithDiscount(item.productId.price, item.productId.discount) * 100
                },
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1
                },
                quantity: item.quantity
            }
        })

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: firebaseUid,
                addressId: addressId
            },
            line_items: line_items,
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        }

        const session = await Stripe.checkout.sessions.create(params)
        console.log("✅ Stripe Session Created:", session);
        return response.status(200).json(session)

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

const getOrderProductItems = async ({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
}) => {
    const productList = []

    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            const product = await Stripe.products.retrieve(item.price.product)

            const paylod = {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: product.metadata.productId,
                product_details: {
                    name: product.name,
                    image: product.images
                },
                paymentId: paymentId,
                payment_status: payment_status,
                delivery_address: addressId,
                subTotalAmt: Number(item.amount_total / 100),
                totalAmt: Number(item.amount_total / 100),
            }

            productList.push(paylod)
        }
    }

    return productList
}

export async function webhookStripe(request, response) {

    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY

    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = Stripe.webhooks.constructEvent(request.body, sig, endPointSecret);
        console.log("✅ Webhook verified:", event.type);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }


    console.log("event", event)
    //  Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {  // ✅ Correct event
            const session = event.data.object;
            console.log("💳 Checkout completed:", session.id);

            const firebaseUid = session.metadata.userId;
            const user = await UserModel.findOne({ uid: firebaseUid });
            if (!user) {
                console.log("❌ User not found for UID:", firebaseUid);
                break;
            }

            const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
            const orderProduct = await getOrderProductItems({
                lineItems,
                userId: user._id,
                addressId: session.metadata.addressId,
                paymentId: session.payment_intent,
                payment_status: session.payment_status,
            });

            const order = await OrderModel.insertMany(orderProduct);
            console.log("🧾 Order created:", order);

            if (order?.length) {
                await UserModel.findByIdAndUpdate(user._id, { shopping_cart: [] });
                await CartProductModel.deleteMany({ userId: user._id });
            }

            break;
        }

        default:
            console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    response.json({ received: true });
}


export async function getOrderDetailsController(request, response) {
    try {
        const firebaseUid = request.userId; // from Firebase Auth middleware

        const user = await UserModel.findOne({ uid: firebaseUid });
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }


        const orderlist = await OrderModel.find({ userId: firebaseUid }).sort({ createdAt: -1 }).populate('delivery_address')

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}