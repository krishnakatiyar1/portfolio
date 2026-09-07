require('dotenv').config();

if (!process.env.VERCEL) {
  try {
    const dns = require('node:dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore DNS override errors in restricted environments
  }
}

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database connection helper for serverless & traditional server
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI missing in environment variables');
  }
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected.');
}

// Middleware to ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (req.url.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        message: `Database error: ${error.message}`
      });
    }
    next();
  }
});

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// Frontend static routes (fallback for local dev)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.css'));
});

app.get(['/Krishna_Katiyar_Resume.pdf', '/resume.pdf', '/resume'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Krishna_Katiyar_Resume.pdf'));
});

// Health routes
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected'
  });
});

// Save message route (supports /api/message, /message, and serverless rewrites)
app.post(['/api/message', '/message', '/api/message/', '/message/', '/api/index.js', '/'], async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address.'
      });
    }

    await Message.create({
      name,
      email,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message saved successfully.'
    });
  } catch (error) {
    console.error('Failed to save message:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
});

// 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Local dev server listener
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
    });
}

module.exports = app;
