import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';


//this method ensures that only logged-in users with a valid access token can proceed
export const protectRoute = async (req ,res ,next) => {
  // next(); like this if we call the next function, then it will go to the next middleware function which is adminRoute()
  try {
    //checks if the user is authenticated by accessing refresh token(log welada ndda check krnwa)
    // we can get the access token from the cookies
    const accessToken = req.cookies.accessToken;

    // if no access token is provided(that means user is not logged in)
    if(!accessToken) {
      return res.status(401).json({message: "Unauthorized - No access token provided"});
    }

    try {
      // if access token is provided, we decode it and get the user id
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      // we find the user in the database and gets details of user
      const user = await User.findById(decoded.userId).select("-password"); //gets details of user expect password

      // if user is not found
      if(!user){
        return res.status(401).json({message: "Unauthorized - User not found"});
      }

      // if user is found, we attach the current logged in user object to the req object. This makes the user info available to the next method
      req.user = user;

      next();
    } catch (error) {
      if(error.name === "TokenExpiredError") {
        return res.status(401).json({message: "Unauthorized - Access token expired"});
      }
     throw error; //we can catch the thrown error in the below catch block
    }

  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(401).json({message: "Unauthorized - Invalid access token"});
  }

}



export const adminRoute = (req ,res ,next) => {
  if(req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({message: "Access denied - admin only"});
  }
}