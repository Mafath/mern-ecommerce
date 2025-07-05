import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { addToCart, removeAllFromCart, updateQuantity, getCartProducts } from '../controllers/cart.controller.js';

const router = express.Router();

router.post('/', protectRoute, addToCart); //not only admins can do this function. That's why we are not adding the admin route here
router.delete('/', protectRoute, removeAllFromCart);
router.put('/:id', protectRoute, updateQuantity);
router.get('/', protectRoute, getCartProducts);

export default router;