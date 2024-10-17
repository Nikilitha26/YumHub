import { pool } from "../config/config.js";

// Function to create a new message
const createMessageDb = async (sender_userID, recipient_userID, message_text) => {
  const [result] = await pool.query(`
    INSERT INTO messages (sender_id, recipient_id, message_text)
    VALUES (?, ?, ?)
  `, [sender_userID, recipient_userID, message_text]);
  return result.insertId; 
  // Return the ID of the newly created message
};

// Function to get messages between two users
const getMessagesDb = async (sender_userID, recipient_userID) => {
  const [data] = await pool.query(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND recipient_id = ?) 
    OR (sender_id = ? AND recipient_id = ?)
    ORDER BY created_at ASC
  `, [sender_userID, recipient_userID, recipient_userID, sender_userID]);
  return data; // Return the list of messages
};

// Function to get a conversation between two users
const getConversationDb = async (sender_userID, recipient_userID) => {
  const [data] = await pool.query(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND recipient_id = ?) 
    OR (sender_id = ? AND recipient_id = ?)
    ORDER BY created_at ASC
  `, [sender_userID, recipient_userID, recipient_userID, sender_userID]);
  return data; // Return the conversation messages
};

// Function to delete a message by ID
const deleteMessageDb = async (id) => {
  await pool.query(`
    DELETE FROM messages 
    WHERE id = ?
  `, [id]);
};

export { createMessageDb, getMessagesDb, getConversationDb, deleteMessageDb };