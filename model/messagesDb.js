import { pool } from "../config/config.js";

// Create a conversation between two users (if not exists)
const getOrCreateConversation = async (user1, user2) => {
    const [rows] = await pool.query(
        `SELECT * FROM conversations 
         WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)`,
        [user1, user2, user2, user1]
    );

    if (rows.length > 0) return rows[0];

    const [result] = await pool.query(
        'INSERT INTO conversations (user1, user2) VALUES (?, ?)',
        [user1, user2]
    );
    return { id: result.insertId, user1, user2 };
};

// Send a message
const sendMessageDb = async (conversationId, senderId, messageText) => {
    const [result] = await pool.query(
        'INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
        [conversationId, senderId, messageText]
    );
    return { messageId: result.insertId };
};

// Get all messages in a conversation
const getMessagesDb = async (conversationId) => {
    const [rows] = await pool.query(
        `SELECT m.id, m.sender_id, u.firstName, u.lastName, m.message_text, m.createdAt
         FROM messages m
         JOIN users u ON m.sender_id = u.userID
         WHERE m.conversation_id = ?
         ORDER BY m.createdAt ASC`,
        [conversationId]
    );
    return rows;
};

// Optional: get all conversations for a user
const getUserConversationsDb = async (userId) => {
    const [rows] = await pool.query(
        `SELECT * FROM conversations
         WHERE user1 = ? OR user2 = ?`,
        [userId, userId]
    );
    return rows;
};

export { getOrCreateConversation, sendMessageDb, getMessagesDb, getUserConversationsDb };
