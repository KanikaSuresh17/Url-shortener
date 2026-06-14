require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const urlService = require('./services/urlService');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({
  origin: '*',
  credentials: false
}));

app.options('*', cors());

// Bypass ngrok browser warning page
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Public redirect route
app.get(['/:shortCode', '/s/:shortCode'], async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const redirectData = await urlService.redirectShortCode(shortCode, ip, userAgent);

    io.emit('click_update', {
      urlId: redirectData.urlId,
      shortCode: redirectData.shortCode,
      clicks: redirectData.clicks,
    });

    res.redirect(302, redirectData.originalUrl);
  } catch (err) {
    if (err.status === 404) return res.status(404).send('Short URL not found');
    next(err);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Startup sequence
sequelize.authenticate()
  .then(() => {
    console.log('Database connection authenticated successfully.');
    const forceSync = process.env.FORCE_DB_SYNC === 'true';
    if (forceSync) console.log('FORCE_DB_SYNC is true. Recreating all tables...');
    return sequelize.sync({ force: forceSync });
  })
  .then(() => {
    console.log('Database synchronized successfully!');
    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database or sync schema:', err);
    process.exit(1);
  });
