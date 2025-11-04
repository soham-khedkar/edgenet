// Statistics Controller - Provides analytics and statistics endpoints
import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js';

/**
 * GET /api/statistics/overview
 * Returns network overview statistics
 */
export const getNetworkOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('network_overview')
      .select('*')
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || {}
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
 * Returns detailed device statistics
 */
export const getDeviceStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const { data, error } = await supabase
      .from('device_statistics')
      .select('*')
      .order('total_bytes', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
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
    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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
    const { data: deviceStats, error: statsError } = await supabase
      .from('device_statistics')
      .select('*')
      .eq('mac_address', mac)
      .single();

    if (statsError) throw statsError;

    // Get recent telemetry for the device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('mac_address', mac)
      .single();

    if (deviceError) throw deviceError;

    const { data: recentTelemetry, error: telemetryError } = await supabase
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
