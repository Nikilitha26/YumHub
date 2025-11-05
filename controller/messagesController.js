import { getOrCreateConversation, sendMessageDb, getMessagesDb, getUserConversationsDb } from "../model/messagesDb.js";

// Send a message
const sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { recipientId, messageText } = req.body;

    if (!recipientId || !messageText) return res.status(400).json({ message: 'Recipient and message required' });

    try {
        const conversation = await getOrCreateConversation(senderId, recipientId);
        const result = await sendMessageDb(conversation.id, senderId, messageText);

        // Optional: create a notification for recipient
        // await createNotificationDb(recipientId, senderId, 'message', 'sent you a message', null);

        res.status(201).json({ message: 'Message sent', messageId: result.messageId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const messages = await getMessagesDb(conversationId);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Get all conversations for a user
const getUserConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        const conversations = await getUserConversationsDb(userId);
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Failed to fetch conversations' });
    }
};

export { sendMessage, getMessages, getUserConversations };
