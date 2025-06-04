const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Importar rutas backend
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Middleware para CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Rutas del backend
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Servir archivos estáticos desde la carpeta frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta catch-all para que cualquier petición que no coincida con las rutas anteriores
// devuelva el index.html para que el frontend maneje las rutas (Single Page Application o web estática)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Levantar servidor
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


