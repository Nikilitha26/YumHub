import { pool } from "../config/config.js";
import bcrypt from 'bcrypt';

const getUsersDb = async ()=>{
    let [data] = await pool.query('SELECT * FROM users')
    return data
}

const getUserDb = async (emailAdd) => {
  let [data] = await pool.query('SELECT * FROM users WHERE emailAdd = ?', [emailAdd]);
  return data;
}

const insertUserDb = async (firstName, lastName, userAge, Gender, userRole, emailAdd, userProfile, hashedPass) => {
  const existingUser = await getUserDb(emailAdd);
  if (existingUser.length > 0) {
      throw new Error(`User with email ${emailAdd} already exists`);
  }
  await pool.query(`
      INSERT INTO users
      (firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [firstName, lastName, userAge, Gender, userRole, emailAdd, hashedPass, userProfile])
}

const deleteUserDb = async (userID) => {
    const result = await pool.query('DELETE FROM users WHERE userID = ?', [userID])
  }

  const updateUserDb = async (userID, firstName, lastName, userAge, Gender, userRole, emailAdd, userPass, userProfile)=>{
    const hashedPass = await bcrypt.hash(userPass, 10);
    await pool.query('UPDATE users SET firstName = ?, lastName = ?, userAge = ?, Gender = ?, userRole = ?, emailAdd = ?, userProfile = ?, userPass = ? WHERE userID = ?',
        [firstName, lastName, userAge, Gender, userRole, emailAdd, userProfile, hashedPass, userID])
  }

export {getUsersDb, getUserDb, insertUserDb, deleteUserDb, updateUserDb}