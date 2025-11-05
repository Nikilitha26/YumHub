import express from 'express';
import { getPosts, getPost, createPost, deletePost, updatePost, likePost, addComment, getComments, editComment, deleteComment, replyComment, getAllComments, likeComment, sharePost, deleteSharedPost, editSharedPost, deleteNotification  } from '../controller/postsController.js';
import { verifyAToken } from '../middleware/authenticate.js';
import { getNotificationsDb, getPostDb } from '../model/postsDb.js';



const router = express.Router();


                // POSTS

// Route to get all posts
router.get('/', getPosts);

// Route to create a post
router.post('/', verifyAToken, createPost);

// Route to get a specific post
router.get('/:id', getPost);

// Route to update a post
router.patch('/:id', verifyAToken, updatePost);

// Route to delete a post
router.delete('/:id', verifyAToken, deletePost);

// Route to share a post
router.post('/:postID/share', verifyAToken, sharePost);

// Delete a shared post
router.delete('/shared/:id', verifyAToken, deleteSharedPost);

// Edit a shared post
router.patch('/shared/:id', verifyAToken, editSharedPost);

// Route to like a post
router.post('/:id/like', verifyAToken, async (req, res) => {
  try {
    const userID = req.user.id;
    const postID = req.params.id;

    const result = await likePost(userID, postID);
    res.json({
      message: result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      likeCount: result.likeCount,
      liked: result.liked
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error liking/unliking post' });
  }
});

                // NOTIFICATIONS

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

router.delete('/notifications/:id', verifyAToken, deleteNotification);


                // COMMENTS

// Add a comment
router.post('/:id/comments', verifyAToken, addComment);

// Get comments for a post
router.get('/:id/comments', getComments);

// get All comments for a post
router.get('/:id/comments', getAllComments);

// Edit comment
router.patch('/comments/:id', verifyAToken, editComment);

// Delete comment
router.delete('/comments/:id', verifyAToken, deleteComment);

// Reply to a comment
router.post('/comments/reply', verifyAToken, replyComment);

// Like or Unlike a comment
router.post('/comments/:id/like', verifyAToken, likeComment);
              

export default router;