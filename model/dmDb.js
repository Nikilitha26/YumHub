import { pool } from "../config/config.js";

const getConversationsDb = async (userID) => {
  try {
    let [data] = await pool.query(`
      SELECT c.id, c.user1_id, c.user2_id, u1.username as user1_username, u2.username as user2_username
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
    `, [userID, userID]);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getConversationDb = async (conversationID) => {
  try {
    let [data] = await pool.query(`
      SELECT * FROM conversations
      WHERE id = ?
    `, [conversationID]);
    return data[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getMessagesDb = async (conversationID) => {
  try {
    let [data] = await pool.query(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `, [conversationID]);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createConversationDb = async (user1ID, user2ID) => {
  try {
    await pool.query(`
      INSERT INTO conversations (user1_id, user2_id)
      VALUES (?,?)
    `, [user1ID, user2ID]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const createMessageDb = async (conversationID, senderID, content) => {
  try {
    await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (?,?,?)
    `, [conversationID, senderID, content]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export { getConversationsDb, getConversationDb, getMessagesDb, createConversationDb, createMessageDb };