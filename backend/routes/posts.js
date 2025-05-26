const express = require('express');
const router = express.Router();
const postModel = require('../models/post');
const authMiddleware = require('../middleware/authMiddleware'); // Will be created in the next step

// POST /api/posts - Create a new post (Requires Authentication)
router.post('/', authMiddleware, (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id; // Assumes authMiddleware attaches user info to req.user

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    if (!userId) {
        // This should technically be caught by authMiddleware if user is not properly authenticated
        return res.status(401).json({ message: 'User not authenticated' });
    }

    postModel.createPost(title, content, userId, (err, post) => {
        if (err) {
            return res.status(500).json({ message: 'Error creating post', error: err.message });
        }
        res.status(201).json({ message: 'Post created successfully', post });
    });
});

// GET /api/posts - Fetch all posts (No Authentication Required)
router.get('/', (req, res) => {
    postModel.getAllPosts((err, posts) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching posts', error: err.message });
        }
        res.status(200).json(posts);
    });
});

// GET /api/posts/:id - Fetch a single post by ID (No Authentication Required)
router.get('/:id', (req, res) => {
    const postId = req.params.id;
    postModel.getPostById(postId, (err, post) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching post', error: err.message });
        }
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    });
});

// PUT /api/posts/:id - Update a post (Requires Authentication and Ownership)
router.put('/:id', authMiddleware, (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const userId = req.user.id; // From authMiddleware

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required for update' });
    }

    // First, verify the post exists and the user owns it (optional, but good practice)
    postModel.getPostById(postId, (err, post) => {
        if (err) {
            return res.status(500).json({ message: 'Error verifying post for update', error: err.message });
        }
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this post' });
        }

        // Proceed with update
        postModel.updatePost(postId, title, content, userId, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating post', error: err.message });
            }
            if (result.changes === 0) {
                // Should be caught by earlier checks, but as a safeguard
                return res.status(404).json({ message: 'Post not found or user not authorized to update' });
            }
            res.status(200).json({ message: 'Post updated successfully', postId, title, content });
        });
    });
});

// DELETE /api/posts/:id - Delete a post (Requires Authentication and Ownership)
router.delete('/:id', authMiddleware, (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id; // From authMiddleware

    // Verify ownership before deleting (similar to PUT)
    postModel.getPostById(postId, (err, post) => {
        if (err) {
            return res.status(500).json({ message: 'Error verifying post for deletion', error: err.message });
        }
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this post' });
        }

        postModel.deletePost(postId, userId, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting post', error: err.message });
            }
            if (result.changes === 0) {
                return res.status(404).json({ message: 'Post not found or user not authorized to delete' });
            }
            res.status(200).json({ message: 'Post deleted successfully' });
        });
    });
});

module.exports = router;
