const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

// (Optionnel) nouveaux routeurs si vous les créez
const overviewRouter = require('./routes/overview');   // GET /api/overview
const agentsRouter   = require('./routes/agents');     // GET/PATCH /api/agents
const historyRouter  = require('./routes/history');    // GET /api/history

const app = express();
const server = http.createServer(app);

// Socket.IO + CORS
const io = socketIo(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET','POST'], credentials: true }
});

// Middlewares
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Routes API
app.use('/api/auth', authRoutes);
require('./routes/chatbot')(io);

// (Optionnel) routes dynamiques si disponibles
app.use('/api/overview', overviewRouter);
app.use('/api/agents',   agentsRouter);
app.use('/api/history',  historyRouter);

// Santé
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Serveur Dentalteam backend opérationnel',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté',
    chatbot: 'Socket.IO activé',
  });
});

// (Conservez ceci si vous vouliez une version statique simple des agents)
// app.get('/api/agents', (req, res) => { ... });

// MongoDB (sans options dépréciées)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO chatbot activé`);
      console.log(`🌐 Frontend autorisé: http://localhost:3000`);
      console.log(`🩺 API endpoints:\n   - GET  /api/health\n   - /api/auth/*\n   - /api/overview\n   - /api/agents\n   - /api/history`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware d'erreurs (4 args) — avant le 404
app.use((err, req, res, next) => {
  console.error('❌ Erreur backend :', err.stack);
  res.status(500).json({
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne',
  });
});

// 404 catch‑all — en DERNIER
app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Route non trouvée',
    requestedUrl: req.originalUrl,
    method: req.method,
  });
});

// Arrêt propre
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT',  gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`🛑 Signal ${signal} reçu. Arrêt propre du serveur...`);
  server.close(() => {
    console.log('✅ Serveur HTTP fermé');
    mongoose.connection.close(() => {
      console.log('✅ Connexion MongoDB fermée');
      process.exit(0);
    });
  });
}

process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée:', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Promise rejetée non gérée:', reason);
  gracefulShutdown('unhandledRejection');
});
