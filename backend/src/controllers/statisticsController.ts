// Statistics Controller - Provides analytics and statistics endpoints
import { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';

/**
 * GET /api/statistics/overview
 * Returns network overview statistics computed from actual devices and telemetry data
 */
export const getNetworkOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get total and active devices
    const { data: allDevices, error: devicesError } = await supabaseAdmin
      .from('devices')
      .select('id, band, connection_status, signal_strength, rx_bytes_total, tx_bytes_total, last_seen_at');

    if (devicesError) throw devicesError;

    const devices = allDevices || [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const activeDevices = devices.filter((d: any) => d.last_seen_at >= fiveMinutesAgo);

    const stats = {
      total_devices: devices.length,
      active_devices: activeDevices.length,
      offline_devices: devices.length - activeDevices.length,
      devices_24ghz: devices.filter((d: any) => d.band?.includes('2.4')).length,
      devices_5ghz: devices.filter((d: any) => d.band?.includes('5')).length,
      total_bandwidth_down: devices.reduce((sum: number, d: any) => sum + (d.rx_bytes_total || 0), 0),
      total_bandwidth_up: devices.reduce((sum: number, d: any) => sum + (d.tx_bytes_total || 0), 0),
      average_signal_strength: activeDevices.length > 0 
        ? activeDevices.reduce((sum: number, d: any) => sum + (d.signal_strength || 0), 0) / activeDevices.length 
        : 0,
      updated_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getNetworkOverview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network overview',
      message: (error as Error).message
    });
  }
};

/**
 * GET /api/statistics/devices
 * Returns detailed device statistics from devices table
 */
export const getDeviceStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('mac_address, hostname, ip_address, band, signal_strength, rx_bytes_total, tx_bytes_total, online_minutes, last_seen_at, first_seen_at')
      .order('rx_bytes_total', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to match statistics format
    const deviceStats = data?.map((d: any) => ({
      mac_address: d.mac_address,
      hostname: d.hostname,
      total_bytes: (d.rx_bytes_total || 0) + (d.tx_bytes_total || 0),
      rx_bytes: d.rx_bytes_total || 0,
      tx_bytes: d.tx_bytes_total || 0,
      average_signal_strength: d.signal_strength || 0,
      connection_uptime_minutes: d.online_minutes || 0,
      last_seen: d.last_seen_at,
      first_seen: d.first_seen_at
    }));

    res.status(200).json({
      success: true,
      count: deviceStats?.length || 0,
      data: deviceStats || []
    });
  } catch (error) {
    console.error('Error in getDeviceStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device statistics',
      message: (error as Error).message
    });
  }
};

/**
 * GET /api/statistics/hourly
 * Returns hourly statistics for the last 24 hours
 */
export const getHourlyStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hourly_statistics')
      .select('*')
      .order('hour', { ascending: false })
      .limit(24);

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Error in getHourlyStatistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hourly statistics',
      message: (error as Error).message
    });
  }
};

/**
 * GET /api/statistics/timeline
 * Returns device activity timeline for the last 7 days
 */
export const getDeviceTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);

    const { data, error } = await supabaseAdmin
      .from('device_activity_timeline')
      .select('*')
      .order('day', { ascending: false })
      .limit(days * 10); // Approximate records

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Error in getDeviceTimeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device timeline',
      message: (error as Error).message
    });
  }
};

/**
 * GET /api/statistics/top-bandwidth
 * Returns top bandwidth consuming devices
 */
export const getTopBandwidthConsumers = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const { data, error } = await supabaseAdmin
      .from('top_bandwidth_consumers')
      .select('*')
      .limit(limit);

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Error in getTopBandwidthConsumers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top bandwidth consumers',
      message: (error as Error).message
    });
  }
};

/**
 * GET /api/statistics/device/:mac
 * Returns detailed statistics for a specific device
 */
export const getDeviceStatisticsById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mac } = req.params;

    if (!mac) {
      res.status(400).json({
        success: false,
        error: 'MAC address is required'
      });
      return;
    }

    // Get device statistics
    const { data: deviceStats, error: statsError } = await supabaseAdmin
      .from('device_statistics')
      .select('*')
      .eq('mac_address', mac)
      .single();

    if (statsError) throw statsError;

    // Get recent telemetry for the device
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('id')
      .eq('mac_address', mac)
      .single();

    if (deviceError) throw deviceError;

    const { data: recentTelemetry, error: telemetryError } = await supabaseAdmin
      .from('telemetry_data')
      .select('*')
      .eq('device_id', (device as any).id)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (telemetryError) throw telemetryError;

    res.status(200).json({
      success: true,
      data: {
        statistics: deviceStats,
        recent_telemetry: recentTelemetry || []
      }
    });
  } catch (error) {
    console.error('Error in getDeviceStatisticsById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device statistics',
      message: (error as Error).message
    });
  }
};
