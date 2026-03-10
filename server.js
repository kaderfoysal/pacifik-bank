// /server.js (or your main entry file)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http'; // 1. Import the 'http' module
import { Server } from 'socket.io'; // 2. Import the Server from 'socket.io'
import path from 'path';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173', // Your local frontend
    'https://pacificbank.online'      // Your live frontend
];
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};

// --- Create HTTP Server and Initialize Socket.IO ---
const server = http.createServer(app); // 3. Create an HTTP server from the Express app
const io = new Server(server, {         // 4. Initialize Socket.IO with the server
    cors: corsOptions // Use the same CORS options for Socket.IO
});


// --- Middleware ---
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the 'public' directory
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


// --- Real-time Logic with Socket.IO ---

// This object will map a userId to their unique socket.id
let userSockets = {};

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Listen for an event from the client to store their user ID
    socket.on('storeUserId', (data) => {
        if (data.userId) {
            userSockets[data.userId] = socket.id;
            console.log(`Associated userId ${data.userId} with socketId ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Clean up the map when a user disconnects
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});


// --- Middleware to make 'io' and 'userSockets' accessible in your routes ---
app.use((req, res, next) => {
    req.io = io;
    req.userSockets = userSockets;
    next();
});

// --- Use Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


// --- Start Server ---
const PORT = process.env.PORT || 8080;
// 5. Use 'server.listen' instead of 'app.listen'
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});