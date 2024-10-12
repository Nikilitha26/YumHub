import { pool } from "../config/config.js";

const getProductsDb = async () => {
    let [data] = await pool.query('SELECT * FROM products');
    return data;
};

const getProductDb = async (prodID) => {
    let [[data]] = await pool.query('SELECT * FROM products WHERE prodID = ?', [prodID]);
    return data;
};

const insertProductDb = async (prodName, quantity, amount, Category, prodUrl, prodDescription) => {
    await pool.query(`
      INSERT INTO products
      (prodName, quantity, amount, Category, prodUrl, prodDescription)
      VALUES (?,?,?,?,?,?)
    `, [prodName, quantity, amount, Category, prodUrl, prodDescription]);
};

const deleteProductDb = async (prodID) => {
    await pool.query('DELETE FROM products WHERE prodID = ?', [prodID]);
};

const updateProductDb = async (prodID, prodName, quantity, amount, Category, prodUrl, prodDescription) => {
    await pool.query(`
      UPDATE products
      SET prodName = ?, quantity = ?, amount = ?, Category = ?, prodUrl = ?, prodDescription = ?
      WHERE prodID = ?
    `, [prodName, quantity, amount, Category, prodUrl, prodDescription, prodID]);
};

const bookProductDb = async (userID, prodID) => {
    try {
      // Get the product's current quantity
      let [[product]] = await pool.query('SELECT quantity FROM products WHERE prodID = ?', [prodID]);
  
      if (product.quantity <= 0) {
        throw new Error('Product is out of stock');
      }
  
      // Insert a new record into the orders table
      await pool.query(`
        INSERT INTO orders (userID, prodID) VALUES (?,?)
      `, [userID, prodID]);
  
      // Update the product's quantity
      await pool.query(`
        UPDATE products
        SET quantity = quantity - 1
        WHERE prodID = ?
      `, [prodID]);
  
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };



export {getProductsDb, getProductDb, insertProductDb, deleteProductDb, updateProductDb, bookProductDb};
