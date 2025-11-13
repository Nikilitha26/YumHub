import { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb, createNotificationDb, insertCommentDb, getCommentsDb, getCommentByIdDb, deleteCommentDb, updateCommentDb, replyCommentDb, likeCommentDb, sharePostDb, deleteSharedPostDb, editSharedPostDb, deleteNotificationDb } from '../model/postsDb.js'
import { getUsersDb } from '../model/usersDb.js'
import{getUserDbById} from '../model/usersDb.js'
import { pool } from '../config/config.js';

            // POSTS

// const getPosts = async (req, res) => {
//   try {
//     const userID = req.user?.id; // safe optional chaining
//     const posts = await getPostsDb(userID);
//     res.json(posts);
//   } catch (err) {
//     console.error('Error fetching posts:', err);
//     res.status(500).json({ message: 'Failed to fetch posts' });
//   }
// };

const getPosts = async (req, res) => {
  try {
    const userID = req.user ? req.user.userID : null;
    const posts = await getPostsDb(userID);

    const formattedPosts = posts.map(post => ({
      ...post,
      liked: !!post.likedByUser,
      likeCount: post.likeCount || 0
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

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
  try {
    if (!req.body || !req.user) {
      return res.status(400).json({ 
          message: 'Invalid request: missing body or user authentication' 
      });
    }

    const { title, content, imageUrl, category, tags } = req.body;
    const userID = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await insertPostDb(
        userID,
        title,
        content,
        imageUrl || '',
        category || 'General',
        tags || [],
        0
    );

    // Fetch followers
    const [followers] = await pool.query('SELECT followerID FROM followers WHERE userID = ?', [userID]);
    for (const f of followers) {
      await createNotificationDb(f.followerID, userID, 'new_post', `${req.user.firstName} added a new post`, result.insertId);
    }

    return res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Error creating post' });
  }
};

// Update a post
const updatePost = async (req, res) => {
  const postId = req.params.id;
  const userID = req.user.userID;

  console.log('updatePost → postId:', postId);
  try {
    const post = await getPostDb(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
  if (Number(post.userID) !== Number(userID)) {
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
  const userID = req.user.id; 

  try {
      const post = await getPostDb(postId);
      if (!post) {
          return res.status(404).json({ error: 'Post not found' });
      }

      if (post.userID !== userID) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
      }

    await deletePostDb(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting post' });
  }
};

// Like a post
const likePost = async (userID, userFirstName, postID) => {
  try {
    const post = await getPostDb(postID);
    if (!post) throw new Error('Post not found');

    // Check if the user already liked the post
    const [rows] = await pool.query(
      'SELECT * FROM likes WHERE userID = ? AND postID = ?',
      [userID, postID]
    );

    let liked;
    if (rows.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE userID = ? AND postID = ?', [userID, postID]);
      post.likeCount = Math.max(post.likeCount - 1, 0);
      liked = false;
    } else {
      // Like
      await pool.query('INSERT INTO likes (userID, postID) VALUES (?, ?)', [userID, postID]);
      post.likeCount++;
      liked = true;

      if (post.userID !== userID) {
        await createNotificationDb(
          post.userID,
          userID,
          'like',
          `${userFirstName} liked your post`,
          postID
        );
      }
    }

    // Update likeCount in posts table
    await updatePostDb(postID, post.title, post.content, post.imageUrl, post.category, post.tags, post.likeCount);

    return { likeCount: post.likeCount, liked };
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    throw new Error('Failed to like/unlike post');
  }
};

// Share a post
const sharePost = async (req, res) => {
  try {
    const userID = req.user.userID; 
    const { caption } = req.body;
    const { postID } = req.params;

    // Get the original post
    const [originalRows] = await pool.query(`SELECT * FROM posts WHERE postID = ?`, [postID]);
    if (originalRows.length === 0) return res.status(404).json({ message: "Post not found" });

    const original = originalRows[0];

    // Create new post referencing shared one
    await pool.query(
      `INSERT INTO posts (userID, title, content, imageUrl, sharedFrom, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userID, caption || original.title, original.content, original.imageUrl, original.userID]
    );

    // Increment share count
    await pool.query(`UPDATE posts SET shareCount = shareCount + 1 WHERE postID = ?`, [postID]);

    // Return updated post
    const [updatedRows] = await pool.query(`SELECT * FROM posts WHERE postID = ?`, [postID]);
    res.json(updatedRows[0]);

  } catch (err) {
    console.error("Error sharing post:", err);
    res.status(500).json({ message: "Failed to share post" });
  }
};

// Delete a shared post
const deleteSharedPost = async (req, res) => {
  try {
    const { postID } = req.params;
    const userID = req.user?.id;

    if (!userID) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if post exists and belongs to this user
    const [sharedPost] = await pool.query(
      "SELECT * FROM posts WHERE postID = ? AND userID = ? AND sharedFromPostID IS NOT NULL",
      [postID, userID]
    );

    if (!sharedPost.length) {
      return res.status(404).json({ message: "Shared post not found or not owned by user" });
    }

    // Delete the shared post
    await pool.query("DELETE FROM posts WHERE postID = ? AND userID = ?", [postID, userID]);

    res.json({ message: "Shared post deleted successfully" });
  } catch (err) {
    console.error("Error deleting shared post:", err);
    res.status(500).json({ message: "Failed to delete shared post", error: err.message });
  }
};

// Edit a shared post
const editSharedPost = async (req, res) => {
  const postID = req.params.id;
  const userID = req.user.userID; // from token
  const { content } = req.body; // <-- use 'content' instead of 'caption'

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const post = await getPostDb(postID);

    if (!post) return res.status(404).json({ message: 'Shared post not found' });
    if (post.userID !== userID) return res.status(403).json({ message: 'Forbidden: You can only edit your own shared posts' });

    // Update only content
    const result = await editSharedPostDb(postID, userID, content);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Update failed: shared post not found or no changes' });
    }

    const updatedPost = await getPostDb(postID);
    res.status(200).json({ message: 'Shared post updated successfully', post: updatedPost });

  } catch (error) {
    console.error('Error editing shared post:', error);
    res.status(500).json({ message: 'Failed to edit shared post' });
  }
};


                    //NOTIFICATIONS

// Delete a notification (only if it belongs to the user)
const deleteNotification = async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  try {
    const deleted = await deleteNotificationDb(notificationId, userId);
    if (!deleted) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own notifications' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};


                    // COMMENTS

// Add a comment
const addComment = async (req, res) => {
  try {
    const { commentText, parentCommentID = null } = req.body;
    const postID = req.params.id;
    const userID = req.user.id; // from verifyAToken middleware

    if (!postID || !userID || !commentText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Insert comment into DB and get comment ID
    const commentID = await insertCommentDb(postID, userID, commentText, parentCommentID);

    // Fetch user info
    const userData = await getUserDbById(userID);
    const user = userData[0]; // first item in the array
    const userName = user ? `${user.firstName} ${user.lastName}` : "Unknown";

    // Return full comment object including userName
    res.json({
      commentID,
      postID,
      userID,
      userName,
      commentText,
      parentCommentID,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// get All comments for a post
const getAllComments = async (req, res) => {
    const postID = req.params.postID;

    try {
        const comments = await getCommentsDb(postID);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

// Get comments
const getComments = async (req, res) => {
    try {
        const postID = req.params.id;
        const comments = await getCommentsDb(postID);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
};

// Edit a comment
const editComment = async (req, res) => {
  const commentID = req.params.id;
  const userID = req.user.id;
  const { commentText } = req.body;

  try {
    // Get the comment first
    const [comment] = await pool.query(
      'SELECT * FROM comments WHERE commentID = ?',
      [commentID]
    );

    if (!comment || comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment[0].userID !== userID) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own comments' });
    }

    await updateCommentDb(commentID, commentText);
    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating comment' });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  const commentID = req.params.id;
  const userID = req.user.id;

  try {
    // Get the comment first
    const [comment] = await pool.query(
      'SELECT * FROM comments WHERE commentID = ?',
      [commentID]
    );

    if (!comment || comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment[0].userID !== userID) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    await deleteCommentDb(commentID);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// Reply to a comment
const replyComment = async (req, res) => {
    const { postID, parentCommentID, commentText } = req.body;
    const userID = req.user.id;

    if (!commentText) return res.status(400).json({ message: 'Comment text required' });

    try {
        const replyID = await insertCommentDb(postID, userID, commentText, parentCommentID);

        // Notify parent comment owner if they are not the replier
        const parentComment = await getCommentByIdDb(parentCommentID);
        if (parentComment.userID !== userID) {
            await createNotificationDb(parentComment.userID, userID, 'reply', `${req.user.firstName} replied to your comment`, postID);
        }

        res.status(201).json({ message: 'Reply added successfully', replyID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding reply' });
    }
};

// Like or Unlike a comment
const likeComment = async (req, res) => {
  const commentID = req.params.id;
  const userID = req.user.id;

  try {
    // Ensure the comment exists
    const comment = await getCommentByIdDb(commentID);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const { liked, likeCount } = await likeCommentDb(userID, commentID);

    // Optional notification
if (post.userID !== userID) {
  await createNotificationDb(post.userID, userID, 'comment', `${req.user.firstName} commented on your post`, postID);
}


    res.json({
      message: liked ? 'Comment liked' : 'Comment unliked',
      liked,
      likeCount,
    });
  } catch (error) {
    console.error('Error liking/unliking comment:', error);
    res.status(500).json({ message: 'Failed to like/unlike comment' });
  }
};
                    

export {getPosts, getPost, createPost, deletePost, updatePost, likePost, addComment, getComments, deleteCommentDb, editComment, deleteComment, replyComment, getAllComments, likeComment, sharePost, deleteSharedPost, editSharedPost, deleteNotification, };