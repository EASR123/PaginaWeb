const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Rutas del backend
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// --- SERVIR FRONTEND ---
// Asegúrate de que el frontend esté compilado (ej. `npm run build`) y copiado en la carpeta frontend/build o frontend/dist

app.use(express.static(path.join(__dirname, '../frontend'))); // si usas React

// Fallback para rutas que no son API (debe ir al final)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

