import { pool } from "../config/config.js";
import bcrypt from 'bcrypt';

// const getUsersDb = async ()=>{
//     let [data] = await pool.query('SELECT * FROM users')
//     return data
// }

const getUsersDb = async () => {
  const [data] = await pool.query(`
    SELECT u.*, 
           (SELECT COUNT(*) FROM follows WHERE followed_id = u.userID) AS followers,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.userID) AS following
    FROM users u
  `);
  return data;
}

const getUserDb = async (emailAdd) => {
  let [data] = await pool.query('SELECT * FROM users WHERE emailAdd = ?', [emailAdd]);
  return data;
}

const getUserDbById = async (userID) => {
  let [data] = await pool.query('SELECT * FROM users WHERE userID = ?', [userID]);
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

  const updateUserDb = async (userID, firstName, lastName, userAge, Gender, userRole, emailAdd, hashedPass, userProfile) => {
    await pool.query('UPDATE users SET firstName = ?, lastName = ?, userAge = ?, Gender = ?, userRole = ?, emailAdd = ?, userProfile = ?, userPass = ? WHERE userID = ?', 
      [firstName, lastName, userAge, Gender, userRole, emailAdd, userProfile, hashedPass, userID]);
  };

  // const getFollowersDb = async (userId) => {
  //   const [data] = await pool.query('SELECT * FROM follows WHERE followed_id = ?', [userId]);
  //   return data;
  // }

  // get the followers of a user
  const getFollowersDb = async (userId) => {
    const [data] = await pool.query(`
      SELECT u.* 
      FROM users u 
      JOIN follows f ON u.userID = f.follower_id 
      WHERE f.followed_id = ?
    `, [userId]);
    return data;
  }

  // get the users a user is following
  const getFollowingDb = async (userId) => {
    const [data] = await pool.query(`
      SELECT u.* 
      FROM users u 
      JOIN follows f ON u.userID = f.followed_id 
      WHERE f.follower_id = ?
    `, [userId]);
    return data;
  }

  // get the count of followers and following for a use
  const getUserFollowersAndFollowingDb = async (userId) => {
    const [data] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE followed_id = ?) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following
    `, [userId, userId]);
    return data;
  }

  const createFollowDb = async (followerId, followedId) => {
    const existingFollow = await pool.query('SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?', [followerId, followedId]);
    if (existingFollow.length > 0) {
      throw new Error(`You are already following this user`);
    }
    await pool.query('INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)', [followerId, followedId]);
  };
  
  const deleteFollowDb = async (followerId, followedId) => {
    const existingFollow = await pool.query('SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?', [followerId, followedId]);
    if (existingFollow.length === 0) {
      throw new Error(`You are not following this user`);
    }
    await pool.query('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?', [followerId, followedId]);
  };

export {getUsersDb, getUserDb, getUserDbById, insertUserDb, deleteUserDb, updateUserDb, createFollowDb, deleteFollowDb, getFollowersDb, getFollowingDb, getUserFollowersAndFollowingDb}