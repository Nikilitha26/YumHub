import { compare } from "bcrypt";
import { getUserDb } from "../model/usersDb.js";
import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
config()


const checkUser = async (req, res) => {
  const { emailAdd, userPass } = req.body;
  console.log('Checking user:', { emailAdd, userPass });
  
  const user = (await getUserDb(emailAdd))[0];
  if (!user) {
    console.error('User not found');
    res.status(401).json({ error: 'User not found' });
    return;
  }
  
  const hashedPass = user.userPass;
  console.log('Stored hashed password:', hashedPass);
  
  if (!hashedPass) {
    console.error('Hashed password not found');
    res.status(401).json({ error: 'Hashed password not found' });
    return;
  }
  
  let result = await compare(userPass.trim(), hashedPass);
  console.log('Password comparison result:', result);
  
  if (result) {
    console.log('Password matches');
    let token = jwt.sign({ emailAdd: emailAdd }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.json({ token: token, message: 'You have signed in!!' });
  } else {
    console.error('Password incorrect');
    res.status(401).json({ error: 'Password incorrect' });
  }
};



const verifyAToken = (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.headers.cookie) {
        token = req.headers.cookie.match(/token=([^;]*)/)[1];
      }
      if (!token) {
        res.json({ message: 'No token provided' });
        return;
      }
      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
          res.json({ message: 'Token expired' });
          return;
        }
        req.body.user = decoded.emailAdd;
        next();
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error verifying token');
    }
  };
    
    export {checkUser, verifyAToken}