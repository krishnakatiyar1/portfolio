require('dotenv').config();

const dns = require('dns');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const messageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
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
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Message = mongoose.model('Message', messageSchema);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.post('/api/message', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required.'
            });
        }

        await Message.create({ name, email, message });

        res.status(201).json({
            success: true,
            message: 'Message saved successfully.'
        });
    } catch (error) {
        console.error('Failed to save message:', error);
        res.status(500).json({
            success: false,
            message: 'Message could not be saved.'
        });
    }
});

async function startServer() {
    if (!MONGODB_URI) {
        console.error('Missing MONGODB_URI. Add it to backend/.env before starting the server.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}...`);
            console.log('MongoDB connected.');
        });
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

startServer();
