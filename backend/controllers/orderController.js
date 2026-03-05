import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

// config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'https://tomato-frontend-ds0g.onrender.com';

// Placing User Order for Frontend
const placeOrder = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Calculate total amount in paise (Razorpay expects amount in smallest currency unit)
        const totalAmount = (req.body.amount * 100); // Convert to paise
        
        const options = {
            amount: totalAmount,
            currency: "INR",
            receipt: `order_${newOrder._id}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: totalAmount,
            currency: "INR",
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }

}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }
}

// Razorpay payment verification
const verifyRazorpayPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    try {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            await orderModel.findByIdAndUpdate(orderId, { 
                payment: true,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Payment verification error" });
    }
}

export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, verifyRazorpayPayment }
