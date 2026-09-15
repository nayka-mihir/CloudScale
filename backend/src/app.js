import express from 'express';
import cors from 'cors';
import path from 'path'; // 1. Import path
import fs from 'fs';   // 2. Optional: to verify directory exists
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

// API Routes prefix (must be BEFORE static fallback)
app.use('/api', apiRoutes);

// ==========================================
// 3. Serve Frontend Static Assets (Production / Docker)
// ==========================================
const frontendDist = process.env.FRONTEND_DIST_PATH;

if (frontendDist && fs.existsSync(frontendDist)) {
    // Serve static JS, CSS, images, etc.
    app.use(express.static(frontendDist));

    // SPA fallback: any route not matching /api or /health returns index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

// Global Error Handler
app.use(errorHandler);

export default app;
