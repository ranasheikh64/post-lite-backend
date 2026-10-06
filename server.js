require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Run listen anywhere except Vercel
if (!process.env.VERCEL) {
  connectDB().then(() => {
    const server = http.createServer(app);
    
    // Initialize Socket.io
    const io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        let authPayload = socket.handshake.auth || {};
        let authHeaders = authPayload.headers || {};
        let token = socket.handshake.headers.authorization || 
                    authPayload.token || 
                    authPayload.Authorization || 
                    authPayload.authorization ||
                    authHeaders.Authorization ||
                    authHeaders.authorization;

        console.log("Socket Handshake Auth Payload:", authPayload);
        console.log("Extracted Token:", token);

        if (!token) {
            return next(new Error("Authentication error: Token not provided"));
        }

        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Authentication error: Invalid token"));
            socket.user = decoded.user || decoded; 
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`User connected to PostmanClone Socket: ${socket.user.id || socket.id}`);
        
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id || socket.id}`);
        });
    });

    server.listen(process.env.PORT || 4000, () => {
      console.log(`Jronix backend running on port ${process.env.PORT || 4000} with Socket.io 🚀`);
    });
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
