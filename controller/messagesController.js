import { getOrCreateConversation, sendMessageDb, getMessagesDb, getUserConversationsDb, getMessageByIdDb, deleteMessageDb, updateMessageDb,  } from "../model/messagesDb.js";

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

// Update a message (only if sender)
const updateMessage = async (req, res) => {
    const messageID = req.params.id;
    const userID = req.user.id;
    const { message_text } = req.body;

    try {
        const message = await getMessageByIdDb(messageID);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender_id!== userID) return res.status(403).json({ message: 'Forbidden: You can only edit your own messages' });

        await updateMessageDb(messageID, message_text);
        res.json({ message: 'Message updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update message' });
    }
};

// Delete a message (only if sender)
const deleteMessage = async (req, res) => {
    const messageID = req.params.id;
    const userID = req.user.id;

    try {
        const message = await getMessageByIdDb(messageID);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender_id !== userID) return res.status(403).json({ message: 'Forbidden: You can only delete your own messages' });

        await deleteMessageDb(messageID);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete message' });
    }
};


export { sendMessage, getMessages, getUserConversations, deleteMessage, updateMessage };
