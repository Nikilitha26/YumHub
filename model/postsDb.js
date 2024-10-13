import { pool } from "../config/config.js";

const getPostsDb = async () => {
    let [data] = await pool.query('SELECT * FROM posts');
    return data;
};

const getPostDb = async (postID) => {
    let [[data]] = await pool.query('SELECT * FROM posts WHERE postID = ?', [postID]);
    return data;
};

const insertPostDb = async (title, content, imageUrl, category, tags, likeCount) => {
    await pool.query(`
      INSERT INTO posts
      (title, content, imageUrl, category, tags, likeCount)
      VALUES (?,?,?,?,?)
    `, [title, content, imageUrl, category, JSON.stringify(tags), likeCount]);
};

const deletePostDb = async (postID) => {
    await pool.query('DELETE FROM posts WHERE postID = ?', [postID]);
};

const updatePostDb = async (postID, title, content, imageUrl, category, tags, likeCount) => {
    await pool.query(`
      UPDATE posts
      SET title = ?, content = ?, imageUrl = ?, category = ?, tags = ?, likeCount = ?
      WHERE postID = ?
    `, [title, content, imageUrl, category, JSON.stringify(tags),likeCount, postID]);
};

const likePostDb = async (userID, postID) => {
    try {
      // Insert a new record into the likes table
      await pool.query(`
        INSERT INTO likes (userID, postID) VALUES (?,?)
      `, [userID, postID]);
  
      // Update the post's like count
      await pool.query(`
        UPDATE posts
        SET likeCount = likeCount + 1
        WHERE postID = ?
      `, [postID]);
  
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

export {getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb};
