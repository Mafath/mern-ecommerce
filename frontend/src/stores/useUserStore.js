// this is gonna be the file that we create to be able to have global state for the user related things such as the user state-> if we are checking for the authentication,
//if we are signing out, login or sign up user

import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast"; //for notifications


// creates and exports a Zustand store hook called useUserStore
export const useUserStore = create((set, get) => ({
  // these are state variables
  user: null, //holds the logged-in user’s data (initially null)
  loading: false, //shows if signup/login is in progress
  checkingAuth: true, //can be used when checking if user is already logged in


// these are actions
// This function runs when we call signup(formData) from our SignupPage.jsx
  signup: async ( { name, email, password, confirmPassword } ) => {  //user will send these info when signup
    set({ loading: true }); //set loading to true

    if(password !== confirmPassword) { //if password and confirm password are not the same
      toast.error("Passwords do not match"); //show error message
      set({ loading: false }); //set loading to false
      return; //return
    }

    try {
      //This sends an HTTP POST request to your backend.
      const res = await axios.post("/auth/signup", { name, email, password }); //send the data to the backend
      set({ user: res.data, loading: false }); //set user to data.user and loading to false
    } catch (error) {
      set({ loading: false }); //set loading to false
      toast.error(error.response.data.message || "An error occurred"); //show error message that's coming from the backend || or a custom error message
    }

  },

  /*
➡️ Since your request URL is "/auth/signup", and axios base URL is set to "http://localhost:5000/api", the final URL becomes: http://localhost:5000/api/auth/signup

➡️ The request body contains this JSON:
{
  "name": "Kevin",
  "email": "kevin@gmail.com",
  "password": "123456"
}

➡️ res contains the response from backend
{
  "success": true,
  "user": {
    "_id": "12345",
    "name": "Kevin",
    "email": "kevin@gmail.com",
    ...
  }
}

➡️ res.data.user // will contain the user object


➡️ set({ user: res.data.user, loading: false });
This updates the Zustand state:
Sets the user object in the store (marks them as signed up).
Turns off the loading spinner (loading: false).



🔻How frontend (5173) talks to backend (5000)
This is all thanks to your axios.js config.


*/
  login: async ( { email, password } ) => {  //user will send these info when signup
    set({ loading: true }); //set loading to true

    try {
      //This sends an HTTP POST request to your backend.
      const res = await axios.post("/auth/login", { email, password }); //send the data to the backend
      set({ user: res.data, loading: false }); //set user to data.user and loading to false
    } catch (error) {
      set({ loading: false }); //set loading to false
      toast.error(error.response.data.message || "An error occurred"); //show error message that's coming from the backend || or a custom error message
    }

  },


  //whenever we refreah the page, we check whether the user is logged in or not an direct to the pages based on the user state
  checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

  logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},


  refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},


}))




// TODO : Implement the axios interceptors for refreshing access token

// After every 15 mins we need to login again. once the 15 min is finished, when we refresh we will be logged out(access token expired)

// Axios interceptor for token refresh

// we use the refresh token of the user to immediately get a new access token
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);