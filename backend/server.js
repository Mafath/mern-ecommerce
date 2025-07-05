import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
// import path from 'path';

//routes
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';

import { connectDB } from './lib/db.js';

const app = express();
app.use(express.json({ limit: "10mb"})); //allows you to parse the body of request
app.use(cookieParser());

dotenv.config();
const PORT = process.env.PORT || 5000;

// const __dirname = path.resolve();



app.use("/api/auth", authRoutes); //if user visits http://localhost:5000/api/auth, it will be handle by authRoutes
app.use("/api/products", productRoutes); //if user visits http://localhost:5000/api/products, it will be handle by productRoutes
app.use("/api/cart", cartRoutes); //if user visits http://localhost:5000/api/cart, it will be handle by cartRoutes
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// if(process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "/frontend/dist")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
//   });
// }



app.listen(PORT, () => {
  console.log('Server is running on port http://localhost:' + PORT);
  connectDB();
});

