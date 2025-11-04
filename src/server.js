const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('./lib/logger');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        throw error;
    }
};

// Start server function
const startServer = async (port = process.env.PORT || 3000) => {
    await connectDB();

    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            resolve(server);
        });
    });
};

// Graceful shutdown
const shutdown = async (server) => {
    logger.info('Shutting down gracefully...');

    return new Promise((resolve) => {
        server.close(async () => {
            await mongoose.connection.close();
            logger.info('Server and database connections closed');
            resolve();
        });
    });
};

// Start server if running as worker process (not imported as module)
if (require.main === module) {
    let server;

    startServer()
        .then((srv) => {
            server = srv;
        })
        .catch((error) => {
            logger.error('Failed to start server:', error);
            process.exit(1);
        });

    // Handle termination signals
    process.on('SIGTERM', async () => {
        if (server) {
            await shutdown(server);
        }
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        if (server) {
            await shutdown(server);
        }
        process.exit(0);
    });
}

module.exports = { app, startServer, shutdown };
