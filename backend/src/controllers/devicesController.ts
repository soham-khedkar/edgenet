// Devices Controller - Handles device data queries for frontend
import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';

/**
 * GET /api/devices
 * Retrieves all devices from database, ordered by last seen
 * 
 * Query params (optional):
 * - active: 'true' to get only active devices (seen in last 5 minutes)
 * - limit: Number of devices to return (default: 100)
 * 
 * Logic:
 * 1. Parse query parameters
 * 2. Build Supabase query with filters
 * 3. Return devices array ordered by last_seen DESC
 */
export const getAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.active === 'true';
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

        // Build query - use admin client to bypass RLS
        let query = supabaseAdmin
            .from('devices')
            .select('*')
            .order('last_seen_at', { ascending: false })
            .limit(limit);

        // Filter for active devices only (last seen within 5 minutes)
        if (activeOnly) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            query = query.gte('last_seen_at', fiveMinutesAgo);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[getAllDevices] Supabase error:', error);
            throw error;
        }

        res.status(200).json({
            count: data?.length || 0,
            devices: data || []
        });

    } catch (error) {
        console.error('Error in getAllDevices:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: (error as Error).message 
        });
    }
};

/**
 * GET /api/devices/:mac
 * Retrieves a single device by MAC address
 * 
 * Path params:
 * - mac: Device MAC address (format: XX:XX:XX:XX:XX:XX)
 * 
 * Logic:
 * 1. Extract MAC from URL params
 * 2. Query device by MAC (unique identifier)
 * 3. Return device data or 404 if not found
 */
export const getDeviceByMac = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mac } = req.params;

        // Validate MAC address format
        if (!mac || !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
            res.status(400).json({ 
                error: 'Invalid MAC address format',
                expected: 'XX:XX:XX:XX:XX:XX' 
            });
            return;
        }

        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('mac', mac.toUpperCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                res.status(404).json({ 
                    error: 'Device not found',
                    mac: mac 
                });
                return;
            }
            throw error;
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Error in getDeviceByMac:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: (error as Error).message 
        });
    }
};

/**
 * GET /api/devices/:mac/history
 * Retrieves historical telemetry data for a specific device
 * 
 * Path params:
 * - mac: Device MAC address
 * 
 * Query params:
 * - limit: Number of records to return (default: 100, max: 500)
 * 
 * Logic:
 * 1. Extract MAC and limit from params
 * 2. Query telemetry table for payloads containing this device's MAC
 * 3. Extract device-specific data from each telemetry payload
 * 4. Return chronological history
 */
export const getDeviceHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mac } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

        // Validate MAC address
        if (!mac || !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
            res.status(400).json({ 
                error: 'Invalid MAC address format' 
            });
            return;
        }

        // Get device ID first
        const { data: deviceData, error: deviceError } = await supabase
            .from('devices')
            .select('id')
            .eq('mac_address', mac)
            .single();

        if (deviceError || !deviceData) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }

        // Query telemetry_data table for this device
        const { data, error } = await supabase
            .from('telemetry_data')
            .select('*')
            .eq('device_id', (deviceData as any).id)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Format telemetry data for response
        const history = (data as any[] | undefined)
            ?.map((record: any) => {
                return {
                    timestamp: record.timestamp,
                    rx_bytes: record.rx_bytes,
                    tx_bytes: record.tx_bytes,
                    signal_strength: record.signal_strength,
                    connection_time: record.connection_time,
                    packet_loss_rate: record.packet_loss_rate,
                    latency_ms: record.latency_ms
                };
            })
            .filter(Boolean); // Remove null entries

        res.status(200).json({
            mac: mac,
            count: history?.length || 0,
            history: history || []
        });

    } catch (error) {
        console.error('Error in getDeviceHistory:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: (error as Error).message 
        });
    }
};

/**
 * GET /api/devices/stats
 * Returns aggregate statistics about devices
 * 
 * Logic:
 * 1. Count total devices
 * 2. Count active devices (last 5 minutes)
 * 3. Calculate average signal strength
 * 4. Group devices by band (2.4GHz / 5GHz)
 */
export const getDeviceStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Get all devices
        const { data: allDevices, error: allError } = await supabase
            .from('devices')
            .select('*');

        if (allError) throw allError;

        // Calculate stats
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const activeDevices = (allDevices as any[] | undefined)?.filter(d => d.last_seen_at >= fiveMinutesAgo) || [];
        
        const totalDevices = allDevices?.length || 0;
        const activeCount = activeDevices.length;

        // Calculate average signal strength
        const signalLevels = activeDevices
            .map(d => d.signal_strength)
            .filter((s): s is number => s !== null);
        const avgSignal = signalLevels.length > 0
            ? Math.round(signalLevels.reduce((sum, s) => sum + s, 0) / signalLevels.length)
            : 0;

        // Group by band
        const bandCounts = activeDevices.reduce((acc, device) => {
            const band = device.band || 'Unknown';
            acc[band] = (acc[band] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        res.status(200).json({
            total_devices: totalDevices,
            active_devices: activeCount,
            offline_devices: totalDevices - activeCount,
            average_signal_strength: avgSignal,
            devices_by_band: bandCounts,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in getDeviceStats:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: (error as Error).message 
        });
    }
};
