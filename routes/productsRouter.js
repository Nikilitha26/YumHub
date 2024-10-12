import express from 'express'
import {getProducts, getProduct, insertProduct, deleteProduct, updateProduct, } from '../contoller/productController.js'
import { verifyAToken } from '../middleware/authenticate.js'
import { bookProductDb } from '../model/productsDb.js'

const router = express.Router()

router.post('/order', verifyAToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'You must be logged in to book a product' });
      }
      const productId = req.body.prodID;
      // Call the booking logic here, e.g., update the product status, create an order, etc.
      const bookingResult = await bookProductDb(productId);
      if (bookingResult) {
        res.json({ message: 'Product booked successfully' });
      } else {
        throw new Error('Error booking product');
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error booking product' });
    }
  });

// router
//   .route('/order')
//   .post(verifyAToken, (req, res) => {
//     console.log(req.body)
//     res.json({ message: "item added to cart" })
//   })

router.get('/', getProducts)
router.post('/', insertProduct)
router.get('/:id', getProduct)
router.delete('/:id', deleteProduct)
router.patch('/:id', updateProduct)

export default router