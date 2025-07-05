import Coupon from "../models/coupon.model.js";
import { stripe } from "../lib/stripe.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js"; // ✅ Add this line(ISSUE)




export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		//checks that products is in the format of an array
		if (!Array.isArray(products) || products.length === 0) { //this is how we check if something is an array in JS
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * product.quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: [product.image],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			//if coupon is found in the db
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		//now lwts create a session
		const session = await stripe.checkout.sessions.create({
			//this is the format that stripe wants us to put into this function
			payment_method_types: ["card"], //["card", "paypal"] 
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon //if we have a coupon code, we create a coupon in stripe with 'createStripeCoupon' function
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],//if we dont have a coupon code,we just return an empty array
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		//we only want to create a coupon if the total amount is over 200 dollars(200*100 cents = 20000)
		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		//return the id of the session(using this session id thama we visit to the payment page)
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 }); //we divide by 100 to convert from cents to dollars
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};



export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		//if the coupon was used
		if (session.payment_status === "paid") {
			if (session.metadata.couponCode) {
				//we find that and update it's isActive to false
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			}

			// create a new Order
			const products = JSON.parse(session.metadata.products); //converting into a JavaScript object with JSON.parse() method
			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					quantity: product.quantity,
					price: product.price,	//this is the exact same order that we have in Order model
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
			});

			//save the new order to the database
			await newOrder.save();


			// ✅ Clear the cart in user's document(ISSUE)
			await User.findByIdAndUpdate(session.metadata.userId, {
				cartItems: [],
			});


			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};





async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}


async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

  //create a new coupon
	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

  //save the coupon to the database
	await newCoupon.save();

	return newCoupon;
}