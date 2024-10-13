import express from 'express'
import {getPosts, getPost, createPost, deletePost, updatePost, likePost} from '../contoller/postsController.js'
import { verifyAToken } from '../middleware/authenticate.js'

const router = express.Router()

router.post('/like', verifyAToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'You must be logged in to like a post' });
      }
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

router.get('/', getPosts)
router.post('/',  createPost)
router.get('/:id', getPost)
router.delete('/:id',  deletePost)
router.patch('/:id', updatePost)

export default router