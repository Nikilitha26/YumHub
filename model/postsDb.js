import { pool } from "../config/config.js";

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
        const [[data]] = await pool.query('SELECT * FROM posts WHERE postID = ?', [postID]);
        return data;
    } catch (error) {
        console.error('Error fetching post:', error);
        throw new Error('Database error while fetching post');
    }
};

// Insert a new post into the database
const insertPostDb = async (title, content, imageUrl, category, tags, likeCount, userID) => {
    try {
        await pool.query(`
            INSERT INTO posts (title, content, imageUrl, category, tags, likeCount, userID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, content, imageUrl, category, JSON.stringify(tags), likeCount, userID]);
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
        // Insert a new record into the likes table
        await pool.query('INSERT INTO likes (userID, postID) VALUES (?, ?)', [userID, postID]);

        // Update the post's like count
        await pool.query('UPDATE posts SET likeCount = likeCount + 1 WHERE postID = ?', [postID]);
        return true;
    } catch (error) {
        console.error('Error liking post:', error);
        throw new Error('Database error while liking post');
    }
};

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
        const [data] = await pool.query('SELECT * FROM notifications WHERE user_id = ?', [userID]);
        return data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Database error while fetching notifications');
    }
};

export { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb, createNotificationDb, getNotificationsDb };
