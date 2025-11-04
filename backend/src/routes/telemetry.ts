// Telemetry Routes - Endpoints for Python agent to send data
import { Router } from 'express';
import { receiveTelemetry, getTelemetryHistory } from '../controllers/telemetryController.js';

// Create router instance
const router: Router = Router();

// POST /api/telemetry - Receive telemetry data from Python agent
router.post('/', receiveTelemetry);

// GET /api/telemetry - Get telemetry history (optional, for debugging)
router.get('/', getTelemetryHistory);

export default router;
