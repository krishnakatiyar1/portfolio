require('dotenv').config();

console.log("===== MY SERVER.JS IS RUNNING =====");
console.log(__filename);

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
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

const Message = mongoose.model('Message', messageSchema);

// Frontend routes
app.get('/', (req, res) => {
  console.log('ROOT ROUTE HIT');

  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.css'));
});

// Health routes
app.get(['/api/health', '/health'], (req, res) => {
  console.log('HEALTH ROUTE HIT');

  res.status(200).json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected'
  });
});

// Save message route
app.post('/api/message', async (req, res) => {
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
  console.log('404 HIT:', req.url);

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI missing in .env');
    }

    await mongoose.connect(MONGODB_URI);

    console.log('✅ MongoDB connected.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

startServer();
