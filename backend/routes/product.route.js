import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendedProducts, getProductsByCategory, toggleFeaturedProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', protectRoute, adminRoute, getAllProducts); // if user passes both of protectRoute and adminRoute checks, then getAllProducts will be called
router.get('/featured', getFeaturedProducts); //anyone can call thos function. Even if not logged in
router.post('/', protectRoute, adminRoute, createProduct);
router.delete('/:id', protectRoute, adminRoute, deleteProduct);
router.get('/recommendations', getRecommendedProducts);
router.get('/category/:category', getProductsByCategory);
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProduct);  //we can use put too here

// put is used to update entire document
// but if we are updating couple of fields then we can use patch


export default router;