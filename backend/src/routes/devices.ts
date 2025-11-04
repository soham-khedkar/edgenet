// Devices Routes - Endpoints for frontend to query device data
import { Router, type Router as RouterType } from 'express';
import { 
    getAllDevices, 
    getDeviceByMac, 
    getDeviceHistory, 
    getDeviceStats 
} from '../controllers/devicesController.js';

// Create router instance
const router: RouterType = Router();

// GET /api/devices/stats - Get aggregate statistics (must be before /:mac route)
router.get('/stats', getDeviceStats);

// GET /api/devices - Get all devices (with optional filters)
router.get('/', getAllDevices);

// GET /api/devices/:mac - Get single device by MAC address
router.get('/:mac', getDeviceByMac);

// GET /api/devices/:mac/history - Get device historical data
router.get('/:mac/history', getDeviceHistory);

export default router;
