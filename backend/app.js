const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- necesario para rutas absolutas
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Middleware CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas backend
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Ruta fallback: sirve index.html para cualquier ruta no encontrada (para SPA o páginas estáticas)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Inicio del servidor
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
