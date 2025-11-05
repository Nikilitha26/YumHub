import express from 'express';
import { sendMessage, getMessages, getUserConversations,  } from '../controller/messagesController.js';
import { verifyAToken } from '../middleware/authenticate.js';

const router = express.Router();

// Send a message
router.post('/send', verifyAToken, sendMessage);

// Get messages in a conversation
router.get('/conversation/:conversationId', verifyAToken, getMessages);

// Get user's conversations
router.get('/conversations', verifyAToken, getUserConversations);  

export default router;