import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import reminderRoutes from './routes/reminders.js';
import medicineRoutes from './routes/medicines.js';
import symptomRoutes from './routes/symptoms.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required for Vercel and other reverse proxies)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security middleware (configured to work with CORS)
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
}));

// Rate limiting (configured for Vercel)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Trust proxy is set above, so rate limiter will use X-Forwarded-For header
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, Postman)
        // Mobile apps don't send an Origin header
        if (!origin) {
            return callback(null, true);
        }
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:3000',
            'https://swasthyavaani-app.vercel.app',
            'https://swasthyavaani.vercel.app'
        ];
        
        // Check if the origin is allowed or if it's an IP address on the local network
        const isLocalNetwork = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) || 
                              /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                              /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Swasthya Vaani API is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/symptoms', symptomRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server - listen on all network interfaces (0.0.0.0)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`Access the API at http://localhost:${PORT} or http://YOUR_IP_ADDRESS:${PORT}`);
  });
}
export default app;
