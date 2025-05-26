const db = require('../database');

// Create a new post
const createPost = (title, content, userId, callback) => {
    const sql = `INSERT INTO posts (title, content, user_id, created_at, updated_at) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    db.run(sql, [title, content, userId], function(err) {
        if (err) {
            return callback(err);
        }
        callback(null, { id: this.lastID, title, content, userId });
    });
};

// Get all posts, joining with users table to get username
const getAllPosts = (callback) => {
    // Selects posts and includes the username of the author
    const sql = `SELECT p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at, u.username 
                 FROM posts p
                 JOIN users u ON p.user_id = u.id
                 ORDER BY p.created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return callback(err);
        }
        callback(null, rows);
    });
};

// Get a single post by its ID, joining with users table to get username
const getPostById = (postId, callback) => {
    const sql = `SELECT p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at, u.username 
                 FROM posts p
                 JOIN users u ON p.user_id = u.id
                 WHERE p.id = ?`;
    db.get(sql, [postId], (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row);
    });
};

// Optional: Update a post
const updatePost = (postId, title, content, userId, callback) => {
    const sql = `UPDATE posts 
                 SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [title, content, postId, userId], function(err) {
        if (err) {
            return callback(err);
        }
        // this.changes will be 0 if no row was updated (e.g., post not found or user_id didn't match)
        callback(null, { changes: this.changes });
    });
};

// Optional: Delete a post
const deletePost = (postId, userId, callback) => {
    const sql = `DELETE FROM posts WHERE id = ? AND user_id = ?`;
    db.run(sql, [postId, userId], function(err) {
        if (err) {
            return callback(err);
        }
        // this.changes will be 0 if no row was deleted
        callback(null, { changes: this.changes });
    });
};


module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost
};
