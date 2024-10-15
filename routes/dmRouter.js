import express from 'express';
import { verifyAToken } from '../middleware/authenticate.js';
import { getConversationsDb, getConversationDb, getMessagesDb, createConversationDb, createMessageDb } from '../model/dmDb.js';

const router = express.Router();

router.get('/conversations', verifyAToken, async (req, res) => {
  try {
    const userID = req.user.id;
    const conversations = await getConversationsDb(userID);
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting conversations' });
  }
});

router.get('/conversations/:id', verifyAToken, async (req, res) => {
  try {
    const conversationID = req.params.id;
    const conversation = await getConversationDb(conversationID);
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting conversation' });
  }
});

router.get('/conversations/:id/messages', verifyAToken, async (req, res) => {
  try {
    const conversationID = req.params.id;
    const messages = await getMessagesDb(conversationID);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting messages' });
  }
});

router.post('/conversations', verifyAToken, async (req, res) => {
  try {
    const user1ID = req.user.id;
    const user2ID = req.body.user2ID;
    if (!user2ID) {
      res.status(400).json({ message: 'User  2 ID is required' });
      return;
    }
    await createConversationDb(user1ID, user2ID);
    res.json({ message: 'Conversation created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

router.post('/conversations/:id/messages', verifyAToken, async (req, res) => {
  try {
    const conversationID = req.params.id;
    const senderID = req.user.id;
    const content = req.body.content;
    if (!content) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }
    await createMessageDb(conversationID, senderID, content);
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

export default router;