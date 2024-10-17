import express from 'express';
import { sendMessage, getMessages, getConversation, deleteMessage } from '../contoller/dmController.js';

const router = express.Router();

// Route to send a new message
router.post('/', sendMessage);

// Route to get messages between two users
router.get('/', getMessages);

// Route to get the conversation between two users
router.get('/conversation', getConversation);

// Route to delete a message by ID
router.delete('/:id', deleteMessage);

export default router;