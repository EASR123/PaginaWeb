const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Ensure .env variables are loaded

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    userModel.findUserByUsername(username, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking for existing user', error: err.message });
        }
        if (user) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        userModel.createUser(username, password, (err, newUser) => {
            if (err) {
                return res.status(500).json({ message: 'Error creating user', error: err.message });
            }
            res.status(201).json({ message: 'User created successfully', userId: newUser.id });
        });
    });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    userModel.findUserByUsername(username, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error finding user', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // User not found
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error comparing passwords', error: err.message });
            }
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' }); // Password doesn't match
            }

            // Passwords match, generate JWT
            const payload = {
                user: {
                    id: user.id,
                    username: user.username
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error generating token', error: err.message });
                    }
                    res.json({ token });
                }
            );
        });
    });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    // For JWT, logout is primarily a client-side operation (deleting the token).
    // This endpoint can simply acknowledge the request.
    res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;
