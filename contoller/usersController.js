import {getUsersDb, getUserDb, insertUserDb, deleteUserDb, updateUserDb} from '../model/usersDb.js'
import { checkUser } from '../middleware/authenticate.js';
import { hash, compare} from 'bcrypt';
import bcrypt from 'bcrypt';

const getUsers = async(req,res)=>{
    res.json(await getUsersDb());
}

const getUser = async(req,res)=>{
    res.json(await getUserDb(req.params.userID));
}

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
}

  const deleteUser = async (req, res) => {
    try {
        await deleteUserDb(req.params.id)
        res.send('User has been deleted')
    } catch (err) {
        console.error(err)
        res.status(500).send('Error deleting user')
    }
}

const updateUser = async (req, res) => {
  let { userID, firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile } = req.body;
  let user = await getUserDb(req.params.userID);
  userID ? userID = userID : userID = user.userID;
  firstName ? firstName = firstName : firstName = user.firstName;
  lastName ? lastName = lastName : lastName = user.lastName;
  userAge ? userAge = userAge : userAge = user.userAge;
  Gender ? Gender = Gender : Gender = user.Gender;
  userRole ? userRole = userRole : userRole = user.userRole;
  emailAdd ? emailAdd = emailAdd : emailAdd = user.emailAdd;
  if (userPass) {
    userPass = await hash(userPass, 10);
  } else {
    userPass = user.userPass;
  }
  userProfile ? userProfile = userProfile : userProfile = user.userProfile;
  await updateUserDb(userID, firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile);
  res.send('Update was successful');
};

const loginUser = (req, res, token) => {
  checkUser(req, res, () => {
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
  