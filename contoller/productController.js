import {getProductsDb, getProductDb, insertProductDb, deleteProductDb, updateProductDb,bookProductDb } from '../model/productsDb.js'
import { getUsersDb } from '../model/usersDb.js'

const getProducts = async (req, res) => {
    res.json(await getProductsDb())
}

const getProduct = async (req, res) => {
    const productId = req.params.id;
    const product = await getProductDb(productId);
    res.json(product);
  };

const insertProduct = async (req, res) => {
    let { prodName, quantity, amount, Category, prodUrl, prodDescription } = req.body
    await insertProductDb(prodName, quantity, amount, Category, prodUrl, prodDescription)
    res.send('Data was inserted successfully')
}

const deleteProduct = async (req, res) => {
    await deleteProductDb(req.params.id)
    res.send('Product has been deleted')
}

const updateProduct = async(req,res)=>{
    let {prodName, quantity, amount, Category, prodUrl, prodDescription} = req.body
    let product = await getProductDb(req.params.id)
    prodName ? prodName=prodName: prodName = product.prodName
    quantity ? quantity=quantity: quantity = product.quantity
    amount ? amount=amount: amount = product.amount
    Category ? Category=Category: Category = product.Category
    prodUrl ? prodUrl=prodUrl: prodUrl = product.prodUrl
    prodDescription ? prodDescription=prodDescription: prodDescription = product.prodDescription
    await updateProductDb(req.params.id,prodName, quantity, amount, Category, prodUrl, prodDescription)
    res.send('Update was successful')
}
  
const bookProduct = async (req, res) => {
    let userID = req.body.userID;
    let prodID = req.body.prodID;
    if (!userID || !prodID) {
      res.status(400).json({ error: 'userID and prodID are required' });
      return;
    }
    try {
      await bookProductDb(userID, prodID);
      res.json({ message: "Successfully booked!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to book product' });
    }
  }

export {getProducts, getProduct, insertProduct, deleteProduct, updateProduct, bookProduct }