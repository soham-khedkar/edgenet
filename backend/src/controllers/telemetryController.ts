import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js';

/**
 * POST /api/telemetry
 * Simplified telemetry endpoint - receives device data from Python agent
 * 
 * Architecture:
 * 1. Upsert devices into 'devices' table (current state)
 * 2. Store telemetry metrics in 'telemetry_data' table (time-series)
 */
export async function receiveTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const { devices } = req.body;
    
    if (!devices || !Array.isArray(devices)) {
      res.status(400).json({ error: 'Invalid payload: devices array required' });
      return;
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] POST /api/telemetry - ${devices.length} devices`);
    
    const timestamp = new Date().toISOString();
    let successCount = 0;
    
    for (const device of devices) {
      try {
        // Parse bytes from string format
        const parseBytes = (val: any): number => {
          if (typeof val === 'string') {
            return parseInt(val.replace(/[^0-9]/g, '')) || 0;
          }
          return parseInt(val) || 0;
        };
        
        // 1. Upsert device into devices table (current state snapshot)
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .upsert({
            mac_address: device.mac,
            hostname: device.hostname,
            ip_address: device.ipv4 || device.ip_address,
            band: device.band,
            signal_strength: device.signal_level || device.signal_strength,
            connection_status: 'online',
            last_seen_at: timestamp,
            // Extra fields from Python agent
            ssid: device.ssid,
            wireless_mode: device.wireless_mode,
            last_tx_rate: device.last_tx_rate,
            rx_bytes_total: parseBytes(device.rx_bytes),
            tx_bytes_total: parseBytes(device.tx_bytes),
            online_minutes: device.online_minutes || 0,
            power_saving: device.power_saving || false
          } as any, { 
            onConflict: 'mac_address',
            ignoreDuplicates: false
          })
          .select('id')
          .single();
        
        if (deviceError) {
          console.error(`❌ Error upserting device ${device.mac}:`, deviceError);
          continue;
        }
        
        // 2. Store telemetry metrics in telemetry_data table (time-series)
        if (deviceData && (deviceData as any).id) {
          const { error: telemetryError } = await supabase
            .from('telemetry_data')
            .insert({
              device_id: (deviceData as any).id,
              timestamp: timestamp,
              rx_bytes: device.rx_bytes || 0,
              tx_bytes: device.tx_bytes || 0,
              signal_strength: device.signal_level || device.signal_strength,
              connection_time: device.connection_time || 0
            } as any);
          
          if (telemetryError) {
            console.error(`⚠️  Error storing telemetry for ${device.mac}:`, telemetryError);
          }
        }
        
        console.log(`✓ ${device.hostname} (${device.mac}) - IP: ${device.ipv4 || 'N/A'}, Signal: ${device.signal_level || 'N/A'}`);
        successCount++;
        
      } catch (err: any) {
        console.error(`❌ Error processing device ${device.mac}:`, err.message);
      }
    }
    
    res.json({ 
      status: 'ok', 
      received: devices.length,
      stored: successCount,
      message: `Stored ${successCount}/${devices.length} devices` 
    });
    
  } catch (error: any) {
    console.error('❌ Error in receiveTelemetry:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * GET /api/telemetry
 * Retrieves recent telemetry history (optional endpoint for debugging)
 * 
 * Query params:
 * - limit: Number of records to return (default: 50, max: 500)
 */
export const getTelemetryHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);

        const { data, error } = await supabase
            .from('telemetry_data')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.status(200).json({
            count: data?.length || 0,
            data: data || []
        });

    } catch (error) {
        console.error('Error in getTelemetryHistory:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: (error as Error).message 
        });
    }
};
