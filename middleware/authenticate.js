import { compare } from "bcrypt";
import { getUserDb } from "../model/usersDb.js";
import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
config()

// ...existing code...
const SECRET = process.env.SECRET_KEY; // do NOT hardcode a production secret here
// ...existing code...

const checkUser  = async (req, res) => {
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

    if (!SECRET) {
      console.error('SECRET_KEY not set in environment');
      res.status(500).json({ error: 'Server misconfiguration: SECRET_KEY not set' });
      return;
    }
    
    let token = jwt.sign({id: user.userID,  emailAdd: emailAdd }, SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token: token, 
      user: {
        userID: user.userID,
        userRole: user.userRole // use actual field name from DB
      },
      message: 'You have signed in!!' 
    });
  } else {
    console.error('Password incorrect');
    res.status(401).json({ error: 'Password incorrect' });
  }
};

// ...existing code...
const verifyAToken = (req, res, next) => {
  try {
    if (!SECRET) {
      console.error('SECRET_KEY not set in environment');
      res.status(500).json({ error: 'Server misconfiguration: SECRET_KEY not set' });
      return;
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.cookie) {
      const m = req.headers.cookie.match(/token=([^;]*)/);
      token = m && m[1];
    }
    console.log('Token:', token);
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ message: 'Token invalid or expired' });
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