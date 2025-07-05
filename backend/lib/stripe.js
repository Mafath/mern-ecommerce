import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

//initializing a new stripe object
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
