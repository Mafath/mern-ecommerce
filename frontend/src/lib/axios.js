import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",		//in deployment it will be 'whatever/api'  eg:- https://ecommerce-frontend.vercel.app/api
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;


/*
baseURL means every axios request like this:
axios.post("/auth/signup", {...})

Will automatically be sent to:
http://localhost:5000/api/auth/signup


import.meta.mode === "development" is true while developing locally using Vite (your frontend runs at http://localhost:5173).
In production, your frontend runs at https://ecommerce-frontend.vercel.app.

Because your frontend (5173) and backend (5000) are on different ports, your backend must allow cross-origin requests.


So, in your backend, make sure you allow frontend calls using cors like:

const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));




🧑 User fills signup form on frontend (localhost:5173)
        ↓
🔁 signup(formData) is called
        ↓
📡 axios.post("/auth/signup", {...}) sends request to backend
        ↓
🌐 URL becomes: http://localhost:5000/api/auth/signup
        ↓
🛠️ Backend processes signup
        ↓
✅ Sends back user info → saved in Zustand
        ↓
🎉 You can now show user data, redirect, etc.


*/