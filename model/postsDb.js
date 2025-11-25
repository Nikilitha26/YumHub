import { pool } from "../config/config.js";
           

            // Posts

// Fetch all posts from the database
const getPostsDb = async (userID) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        p.postID,
        p.title,
        p.content,
        p.imageUrl,
        p.category,
        p.tags,
        p.likeCount,
        p.shareCount,
        p.sharedFrom,
        p.userID AS authorID,
        u.firstName AS authorFirstName,
        u.lastName AS authorLastName,
        su.firstName AS sharedFromFirstName,
        su.lastName AS sharedFromLastName,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM likes l 
            WHERE l.postID = p.postID AND l.userID = ?
          ) THEN TRUE
          ELSE FALSE
        END AS likedByUser
      FROM posts p
      JOIN users u ON p.userID = u.userID
      LEFT JOIN posts sp ON p.sharedFrom = sp.postID
      LEFT JOIN users su ON sp.userID = su.userID
      ORDER BY p.createdAt DESC
    `, [userID]);

    console.log('Fetched posts:', posts);

    return posts.map(post => ({
      ...post,
      likedByUser: !!post.likedByUser,
      author: `${post.authorFirstName} ${post.authorLastName}`,
      sharedFromUserName: post.sharedFromFirstName
        ? `${post.sharedFromFirstName} ${post.sharedFromLastName}`
        : null,
      tags: Array.isArray(post.tags)
        ? post.tags
        : typeof post.tags === 'string'
        ? post.tags.split(',').map(t => t.trim())
        : [],
    }));
  } catch (error) {
    console.error('Error in getPostsDb:', error);
    throw error;
  }
};

// Fetch single post
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
        const [result] = await pool.query(
            `INSERT INTO posts (userID, title, content, imageUrl, category, tags, likeCount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userID, title, content, imageUrl, category, JSON.stringify(tags), likeCount]
        );
        return result;
    } catch (err) {
        console.error('Error inserting post:', err);
        throw err;
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
await pool.query(` UPDATE posts SET title = ?, content = ?, imageUrl = ?, category = ?, tags = ?, likeCount = ? WHERE postID = ? `, [title, content, imageUrl, category, JSON.stringify(tags), likeCount, postID]);
} catch (error) {
console.error('Error updating post:', error);
throw new Error('Database error while updating post');
}
};

// Like a post in the database
const likePostDb = async (userID, postID) => {
  try {
    // Check if user already liked
    const [rows] = await pool.query('SELECT * FROM likes WHERE userID = ? AND postID = ?', [userID, postID]);
    let liked;
    if (rows.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE userID = ? AND postID = ?', [userID, postID]);
      await pool.query('UPDATE posts SET likeCount = likeCount - 1 WHERE postID = ?', [postID]);
      liked = false;
    } else {
      // Like
      await pool.query('INSERT INTO likes (userID, postID) VALUES (?, ?)', [userID, postID]);
      await pool.query('UPDATE posts SET likeCount = likeCount + 1 WHERE postID = ?', [postID]);
      liked = true;
    }

    // Get updated like count
    const [postRows] = await pool.query('SELECT likeCount FROM posts WHERE postID = ?', [postID]);
    const likeCount = postRows[0]?.likeCount || 0;

    return { liked, likeCount };

  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Database error while liking post');
  }
};


// GET /users/:id/liked-posts
const getLikedPostsDb = async (userID) => {
  const [rows] = await pool.query('SELECT postID FROM likes WHERE userID = ?', [userID]);
  return rows;
};


// Share a post
const sharePostDb = async (userID, postID, caption, userName) => {
  try {
    console.log('sharePostDb → userID:', userID, 'postID:', postID, 'caption:', caption);

    // Getting original post
    const [originalRows] = await pool.query('SELECT * FROM posts WHERE postID = ?', [postID]);
    if (!originalRows.length) throw new Error('Original post not found');
    const original = originalRows[0];

    //Creating shared post
    await pool.query(
      `INSERT INTO posts (userID, title, content, imageUrl, category, tags, likeCount, sharedFrom)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        userID,
        `Shared: ${original.title}`,
        caption || original.content,
        original.imageUrl,
        original.category,
        JSON.stringify(original.tags), 
        postID
      ]
    );

    //Incrementing share count of original
    await pool.query(`UPDATE posts SET shareCount = COALESCE(shareCount, 0) + 1 WHERE postID = ?`, [postID]);

    console.log('Post shared successfully!');
  } catch (err) {
    console.error('Database error while sharing post', err);
    throw new Error('Database error while sharing post');
  }
};

// Delete a shared post by ID
const deleteSharedPostDb = async (postID, userID) => {
  try {
    await pool.query("DELETE FROM notifications WHERE post_id = ?", [postID]);
    const [result] = await pool.query(
      "DELETE FROM posts WHERE postID = ? AND userID = ?",
      [postID, userID]
    );

    return result;
  } catch (error) {
    console.error("Error deleting shared post:", error);
    throw new Error("Database error while deleting shared post");
  }
};

// Edit a shared post's caption
const editSharedPostDb = async (postID, userID, content) => {
  const [result] = await pool.query(
    `UPDATE posts SET content = ? WHERE postID = ? AND userID = ?`,
    [content, postID, userID]
  );
  return result;
};


            // Notifications

// Create a notification in the database
const createNotificationDb = async (notificationUserId, userId, notificationType, notificationText, postId) => {
try {
await pool.query(` INSERT INTO notifications (user_id, notification_type, notification_text, post_id) VALUES (?, ?, ?, ?)` , [notificationUserId, notificationType, notificationText, postId]);
} catch (error) {
console.error('Error creating notification:', error);
throw new Error('Database error while creating notification');
}
};

// Fetch notifications for a user
const getNotificationsDb = async (userID) => {
try {
const [data] = await pool.query( `SELECT n.id AS notificationID, n.notification_type, n.notification_text, n.post_id, n.timestamp, u.userID AS actorID, u.firstName AS actorFirstName, u.lastName AS actorLastName, p.title AS postTitle FROM notifications n LEFT JOIN users u ON n.user_id = u.userID LEFT JOIN posts p ON n.post_id = p.postID WHERE n.user_id = ? ORDER BY n.timestamp DESC `, [userID]);
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
return result.affectedRows > 0;
} catch (error) {
console.error('Error deleting notification:', error);
throw new Error('Database error while deleting notification');
}
};


            // Comments

// Insert a comment
const insertCommentDb = async (postID, userID, commentText) => {
  try {
    //Inserting comment
    const [result] = await pool.query(`
      INSERT INTO comments (postID, userID, commentText, createdAt)
      VALUES (?, ?, ?, NOW())
    `, [postID, userID, commentText]);

    const commentID = result.insertId;

    //Fetching the inserted comment with user's name
    const [rows] = await pool.query(`
      SELECT c.commentID, c.postID, c.userID, c.commentText, c.createdAt, u.firstName, u.lastName
      FROM comments c
      JOIN users u ON c.userID = u.userID
      WHERE c.commentID = ?
    `, [commentID]);

    return rows[0];
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};


// Get all comments for a post
const getCommentsDb = async (postID, userID) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.commentID, 
        c.postID, 
        c.userID, 
        c.commentText, 
        c.parentCommentID, 
        c.createdAt,
        u.firstName, 
        u.lastName,
        COUNT(cl.userID) AS likeCount,
        MAX(CASE WHEN cl.userID = ? THEN 1 ELSE 0 END) AS likedByUser
      FROM comments c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN comment_likes cl ON cl.commentID = c.commentID
      WHERE c.postID = ?
      GROUP BY c.commentID
      ORDER BY c.createdAt ASC
    `, [userID, postID]);

    // Map to include booleans and full names
    return rows.map(c => ({
      ...c,
      liked: !!c.likedByUser,
      likeCount: c.likeCount || 0,
      userName: `${c.firstName} ${c.lastName}`
    }));

  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Database error while fetching comments');
  }
};

// Get the number of comments for a post
const getCommentsCountDb = async (postID) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM comments
      WHERE postID = ?
    `, [postID]);

    return rows[0].count;
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }
};



// get comment by ID
const getCommentByIdDb = async (commentID) => {
try {
const [rows] = await pool.query('SELECT * FROM comments WHERE commentID = ?', [commentID]);
return rows[0];
} catch (error) {
console.error('Error fetching comment:', error);
throw new Error('Database error while fetching comment');
}
};

// const getCommentById = async (commentID) => {
//   const [rows] = await db.execute(
//     `SELECT c.commentID, c.commentText, c.userID, CONCAT(u.firstName, ' ', u.lastName) AS userName, c.createdAt
//      FROM comments c
//      JOIN users u ON c.userID = u.id
//      WHERE c.commentID = ?`,
//     [commentID]
//   );
//   return rows[0]; 
// };



// Update a comment
const updateCommentDb = async (commentID, commentText) => {
try {
await pool.query('UPDATE comments SET commentText = ? WHERE commentID = ?', [commentText, commentID]);
} catch (error) {
console.error('Error updating comment:', error);
throw new Error('Database error while updating comment');
}
};

// Delete a comment
const deleteCommentDb = async (commentID) => {
try {
await pool.query('DELETE FROM comments WHERE commentID = ?', [commentID]);
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
const likeCommentDb = async (userID, commentID, userName) => {
  try {
    const comment = await getCommentByIdDb(commentID);
    if (!comment) throw new Error('Comment not found');

    const [rows] = await pool.query(
      'SELECT * FROM comment_likes WHERE userID = ? AND commentID = ?',
      [userID, commentID]
    );

    let liked;

    if (rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM comment_likes WHERE userID = ? AND commentID = ?',
        [userID, commentID]
      );
      liked = false;
    } else {
      // Liking
      await pool.query(
        'INSERT INTO comment_likes (userID, commentID) VALUES (?, ?)',
        [userID, commentID]
      );
      liked = true;

      // Sending notification if liking someone else's comment
      if (comment.userID !== userID) {
        await createNotificationDb(
          comment.userID,
          userID,
          'like_comment',
          `${userName} liked your comment`,
          comment.postID
        );
      }
    }

    // ALWAYS return updated like count
    const [[{ likeCount }]] = await pool.query(
      `SELECT COUNT(*) AS likeCount FROM comment_likes WHERE commentID = ?`,
      [commentID]
    );

    return { liked, likeCount };

  } catch (error) {
    console.error('Error liking/unliking comment:', error);
    throw new Error('Database error while liking/unliking comment');
  }
};


export { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb, getLikedPostsDb, createNotificationDb, getNotificationsDb, insertCommentDb, getCommentsDb,getCommentsCountDb, updateCommentDb, deleteCommentDb,replyCommentDb, getCommentByIdDb, likeCommentDb, sharePostDb, deleteSharedPostDb, editSharedPostDb, deleteNotificationDb, };
