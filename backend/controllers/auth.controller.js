import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';

// creating 2 tokens
const generateTokens = (userId) => {
  // console.log("inside token function");
  const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
  const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
  return {accessToken, refreshToken};
}

// Now lets save the refresh token to the database
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); //7days
}


const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true, //prevent XSS attacks, cross site scripting attack
    secure : process.env.NODE_ENV === 'production',
    sameSite: "strict", //prevents CSRF attack, cross-site request forgery attack
    maxAge: 15 * 60 * 1000, //15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, //prevent XSS attacks, cross site scripting attack
    secure : process.env.NODE_ENV === 'production',
    sameSite: "strict", //prevents CSRF attack, cross-site request forgery attack
    maxAge: 7 * 24 * 60 * 60 * 1000, //7days
  });
};



export const signup = async (req,res) => {  //http://localhost:5000/api/auth/signup when user visits this route, this function will be called
  
  const { name, email, password } = req.body;
  try {
    //checks if user already exists or not
    const userExists = await User.findOne({ email });

    //if user already exists
    if(userExists) {
      return res.status(400).json({message: 'User already exists'});
    }

    //if user doesn't exist
    const user = await User.create({ name, email, password }); //here the password is already hashed because of the pre-save hook

//  ----------------------authenticate the user(for this we will be using json webtokens with the redis database)----------------------
    //here we create 2 different tokens where we put the user id in the payload
    const {accessToken, refreshToken} =  generateTokens(user._id);

    //now we store the refresh token in the redis database
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message); //for development purposes
    res.status(500).json({message: error.message});
  }
}








export const login = async (req,res) => {
  try {
    // console.log("here runs the login");
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // console.log("here runs the login 2");


    if(user && (await user.matchPassword(password))) {
      const {accessToken, refreshToken} =  generateTokens(user._id);

      // console.log("here runs the login 3");
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
    else{
      res.status(401).json({message: "Invalid email or password"});
    }
  } catch (error) {
    console.log("Error in login controller", error.message); //for development purposes
    res.status(500).json({message: error.message});
  }
}







export const logout = async (req,res) => {
  try {
    //when user logsout we get the refresh token
    const refreshToken = req.cookies.refreshToken;

    //if there is a refresh token, we delete it from the redis database(we have to decode and find the user id)
    if(refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    //then we clear that from the cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({message: "Logged out successfully"});
  } catch (error) {
    console.log("Error in logout controller", error.message); //for development purposes
    res.status(500).json({message: "Server error", error: error.message});
  }
};







// once the access token is expired we should be able to recreate it
// this function will refresh the access token
export const refreshToken = async (req,res) => {
  try {
    // to recreate access token we need to get the refresh token from the cookies
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
      return res.status(401).json({message: "No refresh token provided"});
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // we need to compare the refresh token with the one in the database
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if(refreshToken !== storedToken) {
      return res.status(401).json({message: "Invalid refresh token"});
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
    //now we can set it in to the cookie
    res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure : process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, //15 minutes
  });

    res.json({message: "Token refreshed successfully"});

    
  } catch (error) {
    console.log("Error in refreshToken controller", error.message); //for development purposes
    res.status(500).json({message: "Server error", error: error.message});
  }
}





export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};