import { compare } from "bcrypt";
import { getUserDb } from "../model/usersDb.js";
import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
config()

const SECRET = process.env.SECRET_KEY; 

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
    
    let token = jwt.sign({id: user.userID,  emailAdd: emailAdd, firstName: user.firstName, lastName: user.lastName }, SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token: token, 
      user: {
        userID: user.userID,
        userRole: user.userRole 
      },
      message: 'You have signed in!!' 
    });
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
        }
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }
        
        jwt.verify(token, SECRET, (err, decoded) => {
            if (err) {
                console.log('Token invalid or expired:', err);
                return res.status(401).json({ message: 'Token invalid or expired' });
            }

            req.user = {
                userID: decoded.id,
                emailAdd: decoded.emailAdd,
                firstName: decoded.firstName,
                lastName: decoded.lastName
            };

            console.log('Verified user from token:', req.user);
            next();
        });
    } catch (err) {
        console.error('Error in verifyAToken middleware:', err);
        res.status(500).send('Error verifying token');
    }
};

    
export {checkUser, verifyAToken}