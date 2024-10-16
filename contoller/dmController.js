import { createMessageDb, getMessagesDb, getConversationDb, deleteMessageDb } from '../model/dmDb.js';

// Controller to send a new message
const sendMessage = async (req, res) => {
  const { sender_userID, recipient_userID, message_text } = req.body;
  try {
    const messageId = await createMessageDb(sender_userID, recipient_userID, message_text);
    res.status(201).json({ messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get messages between two users
const getMessages = async (req, res) => {
  const { sender_userID, recipient_userID } = req.query;
  try {
    const messages = await getMessagesDb(sender_userID, recipient_userID);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get the conversation between two users
const getConversation = async (req, res) => {
  const { sender_userID, recipient_userID } = req.query;
  try {
    const conversation = await getConversationDb(sender_userID, recipient_userID);
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete a message by ID
const deleteMessage = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteMessageDb(id);
    res.status(200).json({ message: `Message with ID ${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { sendMessage, getMessages, getConversation, deleteMessage };
