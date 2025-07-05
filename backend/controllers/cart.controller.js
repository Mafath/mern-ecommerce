import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body; //user will send the productId. The client is expected to send a JSON object like: { "productId": "123abc" }
    const user = req.user; //this method comes after protectRoute. so we can get req.user

    //Checks if the product is already in the user's cartItems
    const existingItem = user.cartItems.find(item => item.id === productId);
//  const existingItem = user.cartItems.find(item => item.product.toString() === productId);  CHAT-GPT

    if (existingItem) {
      //if already exists we increment the quantity
      existingItem.quantity += 1;
    } else {
      //if not exists, we add a new item
      user.cartItems.push(productId);
//    user.cartItems.push({ product: productId, quantity: 1 });  CHAT-GPT
    }

    //save the updated user document to the database
    await user.save();
    res.json(user.cartItems); //Respond back with the updated cartItems array

  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body; //user will send the productId
    const user = req.user; //this method comes after protectRoute. so we can get req.user

    //if productId doesnot exist
    if(!productId) {
      user.cartItems = []; //clear the cart
      //If no productId is provided in the body, it means the user wants to remove all items from the cart. We clear the entire cartItems array
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId); //If a productId is provided, it removes the item with that ID from the cart.
//    user.cartItems = user.cartItems.filter(item => item.product.toString() !== productId);   CHAT-GPT
    }
    await user.save(); //save the updated cart to the database and return the updated cart
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const updateQuantity = async (req, res) => {
  try {
    const {id:productId} = req.params; //get the id and rename it to 'productId
    const {quantity} = req.body; //get the quantity
    const user = req.user;

    const existingItem = user.cartItems.find(item => item.id === productId);
//  const existingItem = user.cartItems.find(item => item.product.toString() === productId);  CHAT-GPT

    if (existingItem) {
      //if already exists we increment the quantity

      if(quantity === 0){ //1 thibila minus click krhma, we will just delete the product from cartItems and save the user to DB
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
//      user.cartItems = user.cartItems.filter(item => item.product.toString() !== productId);   CHAT-GPT
        await user.save();
        return res.json(user.cartItems);
      }

      //ehm natuwa wena value ekakat increment or decrement krhma
      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItems);
      
    } else{
      res.status(404).json({message: "Product not found"});
    }
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getCartProducts = async (req, res) => {
  try {
    const products = await Product.find({_id:{$in:req.user.cartItems}}); //we get the products from the database and send them to the client

    //add the quantity property to each product object in the products array and return the modified array of product
    const cartItems = products.map(product => {
      const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);
      return {...product.toJSON(), quantity: item.quantity};
    })

    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};