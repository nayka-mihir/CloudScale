import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/apiRoutes.js';
import { getHealth } from './controllers/healthController.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Direct root health endpoint for ALB Target Group checks
app.get('/health', getHealth);

// API Routes prefix
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
