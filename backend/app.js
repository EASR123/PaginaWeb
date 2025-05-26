const express = require('express');
require('dotenv').config(); // Load environment variables from .env file
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth'); // Import auth routes
const postRoutes = require('./routes/posts'); // Import post routes

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount post routes
app.use('/api/posts', postRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
