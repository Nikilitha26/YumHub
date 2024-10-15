import {getUsersDb, getUserDb, getUserDbById, insertUserDb, deleteUserDb, updateUserDb} from '../model/usersDb.js'
import { checkUser } from '../middleware/authenticate.js';
import { hash, compare} from 'bcrypt';
import bcrypt from 'bcrypt';

const getUsers = async(req,res)=>{
    res.json(await getUsersDb());
}

const getUser = async (req, res) => {
  const userID = req.params.id;
  console.log('Getting user with ID:', userID);

  try {
    const user = await getUserDbById(userID);
    console.log('getUserDb returned:', user);

    if (!user || user.length === 0) {
      res.status(404).json({ error: 'User  not found' });
    } else {
      res.json(user[0]); // Assuming getUserDb returns an array with a single user object
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting user' });
  }
};


const insertUser = async (req, res) => {
  let { firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile } = req.body
  const hashedPass = await hash(userPass, 10);
  try {
    await insertUserDb(firstName, lastName, userAge, Gender, userRole, emailAdd, userProfile, hashedPass)
    res.send('Data successfully inserted!')
  } catch (error) {
    if (error.message.includes('User with email')) {
      res.status(400).send({ error: error.message });
    } else {
      console.error(error)
      res.status(500).send('Error inserting user')
    }
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await getUserDbById(req.params.id);
    if (!user || user.length === 0) {
      res.status(404).json({ error: 'User  not found' });
    } else {
      await deleteUserDb(req.params.id);
      res.send('User  has been deleted');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting user');
  }
};

const updateUser = async (req, res) => {
  console.log('req.body:', req.body);
  console.log('req.params:', req.params);
  let { firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile } = req.body;
  console.log('Extracted values from req.body:', firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile);
  let user = await getUserDbById(req.params.id);
  console.log('User retrieved from database:', user);
  let userID = req.params.id;
  firstName ? firstName = firstName : firstName = user[0].firstName;
  lastName ? lastName = lastName : lastName = user[0].lastName;
  userAge ? userAge = userAge : userAge = user[0].userAge;
  Gender ? Gender = Gender : Gender = user[0].Gender;
  userRole ? userRole = userRole : userRole = user[0].userRole;
  emailAdd ? emailAdd = emailAdd : emailAdd = user[0].emailAdd;
  userProfile ? userProfile = userProfile : userProfile = user[0].userProfile;
  let hashedPass = user[0].userPass;
  if (req.body.updatePassword && userPass && userPass.trim() !== '') {
    console.log('Rehashing new password');
    hashedPass = await bcrypt.hash(userPass.trim(), 10);
  } else {
    console.log('Keeping original hashed password');
  }
  console.log('Updated values:', userID, firstName, lastName, userAge, Gender, userRole, emailAdd, hashedPass, userProfile);
  try {
    await updateUserDb(userID, firstName, lastName, userAge, Gender, userRole, emailAdd, hashedPass, userProfile);
    let updatedUser = await getUserDbById(req.params.id);
    console.log('User after update:', updatedUser);
    console.log('Update successful');
    res.send('Update was successful');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Error updating user');
  }
};

const loginUser = (req, res, token) => {
  console.log('Login attempt:', req.body);
  checkUser(req, res, () => {
    console.log('CheckUser successful');
    res.json({
      message: "You have signed in!!",
      token: token
    });
  });
};


export {getUsers, getUser, insertUser, deleteUser, updateUser, loginUser}


// const updateUser = async (req, res) => {
//     try {
//       let { userID, firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile } = req.body;
//       const user = await getUserDb(req.params.userID);
//       const updatedUser = { ...user, ...req.body };
//       if (userPass) {
//         updatedUser.userPass = await hash(userPass, 10);
//       }
//       await updateUserDb(req.params.userID, updatedUser.firstName, updatedUser.lastName, updatedUser.userAge, updatedUser.Gender, updatedUser.userRole, updatedUser.emailAdd, updatedUser.userPass, updatedUser.userProfile);
//       res.send('Update was successful');
//     } catch (err) {
//       console.error(err);
//       res.status(500).send('Error updating user');
//     }
//   };
  