import { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb, createNotificationDb } from '../model/postsDb.js'
import { getUsersDb } from '../model/usersDb.js'

const getPosts = async (req, res) => {
    res.json(await getPostsDb())
}

// Get a specific post by ID
const getPost = async (req, res) => {
  const postId = req.params.id;
  try {
      const post = await getPostDb(postId);
      if (!post) {
          return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching post' });
  }
};

// Create a new post
const createPost = async (req, res) => {
  const { title, content, imageUrl, category, tags } = req.body;
  const userID = req.user.id; // Get user ID from the verified token

  try {
      await insertPostDb(title, content, imageUrl, category, tags, 0, userID); // Assuming likeCount starts at 0
      res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating post' });
  }
};


// Update a post
const updatePost = async (req, res) => {
  const postId = req.params.id;
  const userID = req.user.id; // Get user ID from the verified token
  
  try {
    const post = await getPostDb(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.userID !== userID) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own posts' });
    }
    
    const { title, content, imageUrl, category, tags, likeCount } = req.body;
    await updatePostDb(postId, title || post.title, content || post.content, imageUrl || post.imageUrl, category || post.category, tags || post.tags, likeCount || post.likeCount);
    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  const postId = req.params.id;
  const userID = req.user.id; // Get user ID from the verified token

  try {
      const post = await getPostDb(postId);
      if (!post) {
          return res.status(404).json({ error: 'Post not found' });
      }

      if (post.userID !== userID) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
      }

      await deletePostDb(postId);
      res.status(204).send(); // No content to send back
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting post' });
  }
};

// Like a post
const likePost = async (userID, postID) => {
  try {
      const post = await getPostDb(postID);
      if (!post) {
          throw new Error('Post not found');
      }

      await likePostDb(userID, postID);
      post.likeCount++;
      await updatePostDb(postID, post.title, post.content, post.imageUrl, post.category, post.tags, post.likeCount);
      // Create a notification for the post owner
      await createNotificationDb(post.userID, userID, 'like', `liked your post`, postID);
      return post.likeCount;
  } catch (error) {
      console.error(error);
      throw new Error('Failed to like post');
  }
};

export {getPosts, getPost, createPost, deletePost, updatePost, likePost}