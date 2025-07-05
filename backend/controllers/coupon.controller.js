import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true});
    res.json(coupon || null); //if there was a coupon in the database, send it, otherwise send null
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const validateCoupon = async (req,res) => {
  try {
    const {code} = req.body;  //if we want we can really put code in the route as well (/validate:code)
    const coupon = await Coupon.findOne({code: code, userId:req.user._id, isActive: true}); // we check if the code is matching with the one user is passing. and few more filters to check validity of the coupon

    if(!coupon){
      return res.status(400).json({message: "Invalid coupon code"});
    }

    //if coupon is already expired
    if(coupon.expirationDate < new Date()){
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({message: "Coupon expired"});
    }

    // if users passess all these checkpoints, 
    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage
    });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};