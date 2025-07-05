import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
    //This stores a reference to the User who placed the order
    //ObjectId is used to link (populate) the user from the users collection
    //ref: "User" tells Mongoose which model to pull data from if you use .populate()
		user: {
			type: mongoose.Schema.Types.ObjectId, // This line is used inside a Mongoose schema to tell MongoDB, "This field will store a reference to another document’s _id"
			ref: "User", //this is gonna be ferefrncing to the User model
			required: true,
		},
		products: [ //maintaining na array because a user can order multiple products
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		stripeSessionId: {
			type: String,
			unique: true,
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
