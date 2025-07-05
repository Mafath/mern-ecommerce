import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //empty curly braces means empty filter. so all the products will be fetched without a filter
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }

}



export const getFeaturedProducts = async (req, res) => {
  try {
    //we will store featured products in the mongoDB. And also we'll save them in redis DB as well. Bcs this featured products can be accessed by eveyone
    //so we can really make it lot more faster by storing it in redis. 

    //check we have any featured products in redis database
    let featuredProducts = await redis.get("featured_products");
    
    //if we have it we can return them
    if(featuredProducts){
      return res.json(JSON.parse(featuredProducts)); //parse them bcs redis store them as strings
    }

    //else we will fetch them from mongoDB and store them in redis
    featuredProducts = await Product.find({isFeatured: true}).lean(); //find all the products that are featured
    //.lean() is gonna return a plain javascript object instead of a mongodb document which is good for performance

    if(!featuredProducts){
      return res.status(404).json({message: "No featured products found in the mongoDB"});
    }

    //store them in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }
};



export const createProduct = async (req, res) => {
  // first we save the product to the database
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if(image){
      cloudinaryResponse = await cloudinary.uploader.upload(image, {folder:"products"}) //uploads the image to Cloudinary under the products folder
    }


    //Saves the product to MongoDB using the Product model. If the image was successfully uploaded, its secure URL is saved. If no image or upload fails, it saves an empty string ""
    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
      category,
    });
    res.status(201).json(product);  //Sends back the created product with status code 201

  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error:error.message});
  }
}




export const deleteProduct = async (req, res) => {
  // when we deleting a product from database, make sure to delete the image from cloudinary as well
  try {
    const product = await Product.findById(req.params.id);

    //if product does not exist
    if(!product){
      return res.status(404).json({message: "Product not found"});
    }

    //if product has an image(always true cuz image is required)
    if(product.image){
      // get the id of that image
      const publicId = product.image.split("/").pop().split(".")[0];

      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from cloudinary");
      } catch (error) {
        console.log("error deleting image from cloudinary", error);
      }
    }
    
    // delete the product from mongoDB
    await Product.findByIdAndDelete(req.params.id);
    res.json({message: "Product deleted successfully"});
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }
}




export const getRecommendedProducts = async (req, res) => {
  // here we'll be using the aggregation pipeline from mongoose
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 }
      },
      {
        $project:{
          _id: 1,
          name: 1,
          description:1,
          image: 1,
          price:1
        }
      }
    ])

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }
}




export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({category});
    res.json({products});
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }
}




export const toggleFeaturedProduct = async (req,res) => {
  // here in this function we'd have to also communicate with redis where we can update the cache. Bcs we were storing the featured
  // products in our cache. when we toggle, we should be able to delete it from the cache or add it

  try {
    const product = await Product.findById(req.params.id);

    // if the product exists
    if(product){
      // toggle the isFeatured field
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      
      // now update the cache(redis)
      await updateFeaturedProductCache();

      res.json(updatedProduct);
    } else{
      res.status(404).json({message: "Product not found"});
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({message: "Server error", error: error.message});
  }
}

async function updateFeaturedProductCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function");
  }
}