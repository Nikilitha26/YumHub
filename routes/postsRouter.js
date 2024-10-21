import express from 'express';
import { getPosts, getPost, createPost, deletePost, updatePost, likePost } from '../contoller/postsController.js';
import { verifyAToken } from '../middleware/authenticate.js';
import { getNotificationsDb } from '../model/postsDb.js';

const router = express.Router();

// Route to like a post
router.post('/like', verifyAToken, async (req, res) => {
    try {
        const { postID } = req.body;
        const userID = req.user.id; // Assuming the user ID is stored in the token

        // Call the liking logic here
        const likeResult = await likePost(userID, postID);
        if (likeResult) {
            res.json({ message: 'Post liked successfully' });
        } else {
            throw new Error('Error liking post');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error liking post' });
    }
});

// Route to get notifications
router.get('/notifications', verifyAToken, async (req, res) => {
    try {
        const userID = req.user.id;
        const notifications = await getNotificationsDb(userID);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting notifications' });
    }
});

// Route to get all posts
router.get('/', getPosts);

// Route to create a post
router.post('/', verifyAToken, async (req, res) => {
    try {
        const userID = req.user.id; // Get user ID from the token
        const postData = { ...req.body, userID }; // Include userID in the post data

        const newPost = await createPost(postData);
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

// Route to get a specific post
router.get('/:id', getPost);

// Route to update a post
router.patch('/:id', verifyAToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userID = req.user.id; // Get user ID from the token
        const post = await getPost(postId); // Fetch the post to check ownership

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userID !== userID) {
            return res.status(403).json({ error: 'Forbidden: You can only edit your own posts' });
        }

        const updatedPost = await updatePost(postId, req.body);
        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating post' });
    }
});

// Route to delete a post
router.delete('/:id', verifyAToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userID = req.user.id; // Get user ID from the token
        const post = await getPost(postId); // Fetch the post to check ownership

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userID !== userID) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
        }

        await deletePost(postId);
        res.status(204).send(); // No content to send back
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting post' });
    }
});

export default router;