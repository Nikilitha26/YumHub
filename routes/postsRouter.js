import express from 'express';
import { getPosts, getPost, createPost, deletePost, updatePost, likePost, addComment, getComments, editComment, deleteComment, replyComment, getAllComments, likeComment, sharePost, deleteSharedPost, editSharedPost, deleteNotification  } from '../controller/postsController.js';
import { verifyAToken } from '../middleware/authenticate.js';
import { getNotificationsDb, getPostDb, sharePostDb, getPostsDb, deleteSharedPostDb } from '../model/postsDb.js';



const router = express.Router();


                // POSTS

// Route to get all posts
// Route to get all posts (with user's liked status)
// router.get('/', verifyAToken, getPosts);
router.get('/', (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return getPosts(req, res); // no login → public fetch
  verifyAToken(req, res, () => getPosts(req, res));
});


// Route to create a post
router.post('/', verifyAToken, createPost);

// Route to get a specific post
router.get('/:id', getPost);

// Route to update a post
router.patch('/:id', verifyAToken, updatePost);

// Route to delete a post
router.delete('/:id', verifyAToken, deletePost);

// Route to share a post
router.post('/:postID/share', verifyAToken, async (req, res) => {
  const userID = req.user.userID; // now req.user is guaranteed
  const { caption, userName } = req.body;
  const postID = req.params.postID;

  console.log('Sharing post → userID:', userID, 'postID:', postID, 'caption:', caption);

  try {
    await sharePostDb(userID, postID, caption, userName);

    const posts = await getPostsDb(userID);
    console.log('Updated posts after share:', posts);
    res.json(posts);
  } catch (err) {
    console.error('Error sharing post:', err);
    res.status(500).json({ message: 'Failed to share post.' });
  }
});

// Delete a shared post
router.delete('/:postID/shared', verifyAToken, async (req, res) => {
  const userID = req.user?.userID; // ✔ use userID as set in middleware
  const postID = req.params.postID;

  if (!userID) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const result = await deleteSharedPostDb(postID, userID);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Shared post not found or not owned by user' });
    }

    res.json({ message: 'Shared post deleted successfully', postID });
  } catch (err) {
    console.error("Error deleting shared post:", err);
    res.status(500).json({ message: 'Failed to delete shared post.' });
  }
});


// Edit a shared post
router.patch('/shared/:id', verifyAToken, editSharedPost);

// Route to like a post
router.post('/:id/like', verifyAToken, async (req, res) => {
  try {
    const userID = req.user.userID; // ✔ fixed
    const userFirstName = req.user.firstName;
    const postID = parseInt(req.params.id);

    if (!userID) return res.status(401).json({ message: 'User not authenticated' });
    if (isNaN(postID)) return res.status(400).json({ message: 'Invalid post ID' });

    const result = await likePost(userID, userFirstName, postID);
    res.json({
      message: result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      likeCount: result.likeCount,
      liked: result.liked
    });
  } catch (error) {
    console.error('Error in toggleLike action:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get all liked posts by a user
router.get('/user/:id/liked-posts', async (req, res) => {
  const userID = req.params.id;
  try {
    const [likedPosts] = await req.app.locals.pool.query(
      `SELECT postID FROM likes WHERE userID = ?`,
      [userID]
    );

    // Return just the array of postIDs
    res.json(likedPosts);
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    res.status(500).json({ message: 'Database error while fetching liked posts' });
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
// router.get('/:id/comments', getAllComments);

// Edit comment
router.patch('/comments/:id', verifyAToken, editComment);

// Delete comment
router.delete('/comments/:id', verifyAToken, deleteComment);

// Reply to a comment
router.post('/comments/reply', verifyAToken, replyComment);

// Like or Unlike a comment
router.post('/comments/:id/like', verifyAToken, likeComment);
      

export default router;