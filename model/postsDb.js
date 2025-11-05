import { pool } from "../config/config.js";
           

            // Posts

// Fetch all posts from the database
const getPostsDb = async () => {
    try {
        const [data] = await pool.query('SELECT * FROM posts');
        return data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error('Database error while fetching posts');
    }
};

// Fetch a single post by ID
const getPostDb = async (postID) => {
    try {
        const [rows] = await pool.query('SELECT * FROM posts WHERE postID = ?', [postID]);
        if (rows.length === 0) return null;
        return rows[0]; 
    } catch (error) {
        console.error('Error fetching post:', error);
        throw new Error('Database error while fetching post');
    }
};

// Insert a new post into the database
const insertPostDb = async (userID, title, content, imageUrl, category, tags, likeCount) => {
    try {
        await pool.query(`
            INSERT INTO posts (userID, title, content, imageUrl, category, tags, likeCount) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userID,title, content, imageUrl, category, JSON.stringify(tags), likeCount]);
        console.log('User ID:', userID);
    } catch (error) {
        console.error('Error inserting post:', error);
        throw new Error('Database error while inserting post');
    }
};

// Delete a post from the database
const deletePostDb = async (postID) => {
    try {
        await pool.query('DELETE FROM posts WHERE postID = ?', [postID]);
    } catch (error) {
        console.error('Error deleting post:', error);
        throw new Error('Database error while deleting post');
    }
};

// Update an existing post in the database
const updatePostDb = async (postID, title, content, imageUrl, category, tags, likeCount) => {
    try {
        await pool.query(`
            UPDATE posts
            SET title = ?, content = ?, imageUrl = ?, category = ?, tags = ?, likeCount = ?
            WHERE postID = ?
        `, [title, content, imageUrl, category, JSON.stringify(tags), likeCount, postID]);
    } catch (error) {
        console.error('Error updating post:', error);
        throw new Error('Database error while updating post');
    }
};

// Like a post in the database
const likePostDb = async (userID, postID) => {
    try {
        await pool.query('INSERT INTO likes (userID, postID) VALUES (?, ?)', [userID, postID]);
        await pool.query('UPDATE posts SET likeCount = likeCount + 1 WHERE postID = ?', [postID]);
        return true;
    } catch (error) {
        console.error('Error liking post:', error);
        throw new Error('Database error while liking post');
    }
};


            // Notifications

// Create a notification in the database
const createNotificationDb = async (notificationUserId, userId, notificationType, notificationText, postId) => {
    try {
        await pool.query(`
            INSERT INTO notifications (user_id, notification_type, notification_text, post_id)
            VALUES (?, ?, ?, ?)
        `, [notificationUserId, notificationType, notificationText, postId]);
    } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Database error while creating notification');
    }
};

// Fetch notifications for a user
const getNotificationsDb = async (userID) => {
  try {
    const [data] = await pool.query(`
      SELECT n.id AS notificationID, n.notification_type, n.notification_text, n.post_id, n.timestamp,
             u.userID AS actorID, u.firstName AS actorFirstName, u.lastName AS actorLastName,
             p.title AS postTitle
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.userID
      LEFT JOIN posts p ON n.post_id = p.postID
      WHERE n.user_id = ?
      ORDER BY n.timestamp DESC
    `, [userID]);

    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Database error while fetching notifications');
  }
};

// Delete a notification
const deleteNotificationDb = async (notificationId, userId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    return result.affectedRows > 0; // true if deleted, false otherwise
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Database error while deleting notification');
  }
};



            // Comments

// Insert a comment
const insertCommentDb = async (postID, userID, commentText, parentCommentID) => {
    try {
        await pool.query(`
            INSERT INTO comments (postID, userID, commentText, parentCommentID)
            VALUES (?, ?, ?, ?)
        `, [postID, userID, commentText, parentCommentID]);
    } catch (error) {
        console.error('Error inserting comment:', error);
        throw new Error('Database error while inserting comment');
    }
};

// Get comments for a post
const getCommentsDb = async (postID) => {
  try {
    const [comments] = await pool.query(`
      SELECT c.commentID, c.commentText, c.createdAt, c.parentCommentID, u.userID, u.firstName, u.lastName
      FROM comments c
      JOIN users u ON c.userID = u.userID
      WHERE c.postID = ?
      ORDER BY c.createdAt ASC
    `, [postID]);

    // Optional: group replies under their parent comment
    const commentMap = {};
    const topLevelComments = [];

    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.commentID] = comment;

      if (comment.parentCommentID) {
        commentMap[comment.parentCommentID]?.replies.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    return topLevelComments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Database error while fetching comments');
  }
};
// get comment by ID
const getCommentByIdDb = async (commentID) => {
    try {
        const [[comment]] = await pool.query(
            'SELECT * FROM comments WHERE commentID = ?',
            [commentID]
        );
        return comment; // single comment or undefined
    } catch (error) {
        console.error('Error fetching comment:', error);
        throw new Error('Database error while fetching comment');
    }
};


// Update a comment
const updateCommentDb = async (commentID, commentText) => {
  try {
    await pool.query(
      'UPDATE comments SET commentText = ? WHERE commentID = ?',
      [commentText, commentID]
    );
  } catch (error) {
    console.error('Error updating comment:', error);
    throw new Error('Database error while updating comment');
  }
};

// Delete a comment
const deleteCommentDb = async (commentID) => {
  try {
    await pool.query(
      'DELETE FROM comments WHERE commentID = ?',
      [commentID]
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Database error while deleting comment');
  }
};

// Reply to a comment
const replyCommentDb = async (userID, postID, parentCommentID, commentText) => {
  try {
    await pool.query(
      `INSERT INTO comments (userID, postID, parentCommentID, commentText)
       VALUES (?, ?, ?, ?)`,
      [userID, postID, parentCommentID || null, commentText]
    );
  } catch (error) {
    console.error('Error creating reply:', error);
    throw new Error('Database error while creating reply');
  }
};

// Like or Unlike a comment
const likeCommentDb = async (userID, commentID) => {
    try {
        const comment = await getCommentByIdDb(commentID);
        if (!comment) throw new Error('Comment not found');

        // Check if user already liked the comment
        const [rows] = await pool.query(
            'SELECT * FROM comment_likes WHERE userID = ? AND commentID = ?',
            [userID, commentID]
        );

        let liked;
        if (rows.length > 0) {
            // Unlike
            await pool.query('DELETE FROM comment_likes WHERE userID = ? AND commentID = ?', [userID, commentID]);
            liked = false;
        } else {
            // Like
            await pool.query('INSERT INTO comment_likes (userID, commentID) VALUES (?, ?)', [userID, commentID]);
            liked = true;

            // Notify comment owner
            if (comment.userID !== userID) {
                await createNotificationDb(comment.userID, userID, 'like_comment', `${req.user.firstName} liked your comment`, comment.postID);
            }
        }

        return { liked };
    } catch (error) {
        console.error('Error liking/unliking comment:', error);
        throw new Error('Database error while liking/unliking comment');
    }
};

// Share a post (creates a new post, optional caption)
const sharePostDb = async (userID, originalPostID, caption) => {
  try {
    const originalPost = await getPostDb(originalPostID);
    if (!originalPost) throw new Error('Original post not found');

    // Insert new post as a share
    await pool.query(`
      INSERT INTO posts (userID, title, content, imageUrl, category, tags, likeCount, sharedFrom)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      userID,
      caption || originalPost.title,
      originalPost.content,
      originalPost.imageUrl,
      originalPost.category,
      JSON.stringify(originalPost.tags), // <- stringify array
      originalPostID
    ]);

    // Notify original post owner
    if (originalPost.userID !== userID) { // Don't notify if user shares their own post
    await createNotificationDb(originalPost.userID, userID, 'share', `${req.user.firstName} shared your post`, originalPostID);
    }

  } catch (error) {
    console.error('Error sharing post:', error);
    throw new Error('Database error while sharing post');
  }
};

// Delete a shared post by ID
const deleteSharedPostDb = async (postID) => {
  try {
    await pool.query('DELETE FROM posts WHERE postID = ?', [postID]);
  } catch (error) {
    console.error('Error deleting shared post:', error);
    throw new Error('Database error while deleting shared post');
  }
};

// Edit a shared post's caption
const editSharedPostDb = async (postID, newCaption) => {
  try {
    await pool.query(
      'UPDATE posts SET title = ? WHERE postID = ?',
      [newCaption, postID]
    );
  } catch (error) {
    console.error('Error editing shared post:', error);
    throw new Error('Database error while editing shared post');
  }
}


export { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb, createNotificationDb, getNotificationsDb, insertCommentDb, getCommentsDb, updateCommentDb, deleteCommentDb,replyCommentDb, getCommentByIdDb, likeCommentDb, sharePostDb, deleteSharedPostDb, editSharedPostDb, deleteNotificationDb, };
