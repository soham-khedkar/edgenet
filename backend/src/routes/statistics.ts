import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';
import {
  getNetworkOverview,
  getDeviceStatistics,
  getHourlyStatistics,
  getDeviceTimeline,
  getTopBandwidthConsumers,
  getDeviceStatisticsById
} from '../controllers/statisticsController.js';

const router: ExpressRouter = Router();

// New-style routes (views-backed)
router.get('/overview', getNetworkOverview);
router.get('/devices', getDeviceStatistics);
router.get('/hourly', getHourlyStatistics);
router.get('/timeline', getDeviceTimeline);
router.get('/top-bandwidth', getTopBandwidthConsumers);
router.get('/device/:mac', getDeviceStatisticsById);

// ----- Backwards-compatible legacy endpoints used by the frontend -----

function parseRangeToStart(range: string | undefined): string {
  const now = new Date();
  const r = range || '24h';
  let start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (r === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (r === '30d') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return start.toISOString();
}

// Legacy: GET /api/statistics/summary -> expected by frontend
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    // Compute summary from actual devices data
    const { data: devices, error } = await supabaseAdmin
      .from('devices')
      .select('rx_bytes_total, tx_bytes_total, last_seen_at');

    if (error) throw error;

    const allDevices = devices || [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const activeDevices = allDevices.filter((d: any) => d.last_seen_at >= fiveMinutesAgo);

    const totalDevices = allDevices.length;
    const totalBandwidthBytes = allDevices.reduce((sum: number, d: any) => 
      sum + (d.rx_bytes_total || 0) + (d.tx_bytes_total || 0), 0);
    const totalBandwidthUsed = `${(totalBandwidthBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    const averageDevicesOnline = activeDevices.length;

    res.json({
      totalDevices,
      totalBandwidthUsed,
      averageDevicesOnline
    });
  } catch (err) {
    console.error('Legacy /summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Legacy: GET /api/statistics/bandwidth -> returns { data: [{ timestamp, download, upload }] }
router.get('/bandwidth', async (req: Request, res: Response) => {
  try {
    const start = parseRangeToStart(req.query.range as string | undefined);
    const { data: telemetry, error } = await supabaseAdmin
      .from('telemetry_data')
      .select('timestamp, rx_bytes, tx_bytes')
      .gte('timestamp', start)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // bucket by hour
    const buckets = new Map<string, { download: number; upload: number; count: number }>();
    (telemetry || []).forEach((t: any) => {
      const hour = new Date(t.timestamp).toISOString().slice(0, 13) + ':00:00';
      const existing = buckets.get(hour) || { download: 0, upload: 0, count: 0 };
      buckets.set(hour, {
        download: existing.download + (t.rx_bytes || 0),
        upload: existing.upload + (t.tx_bytes || 0),
        count: existing.count + 1
      });
    });

    const data = Array.from(buckets.entries()).map(([timestamp, values]) => ({
      timestamp,
      download: values.count ? (values.download / values.count) / (1024 * 1024) : 0,
      upload: values.count ? (values.upload / values.count) / (1024 * 1024) : 0
    }));

    res.json({ data });
  } catch (err) {
    console.error('Legacy /bandwidth error:', err);
    res.status(500).json({ error: 'Failed to fetch bandwidth data' });
  }
});

// Legacy: GET /api/statistics/device-usage
router.get('/device-usage', async (req: Request, res: Response) => {
  try {
    const start = parseRangeToStart(req.query.range as string | undefined);
    const { data: telemetry, error } = await supabaseAdmin
      .from('telemetry_data')
      .select('device_id, rx_bytes, tx_bytes, devices(hostname, mac_address)')
      .gte('timestamp', start);

    if (error) throw error;

    const deviceMap = new Map<string, { name: string; usage: number }>();
    (telemetry || []).forEach((t: any) => {
      const deviceId = t.device_id;
      const deviceName = t.devices?.hostname || t.devices?.mac_address || `Unknown Device`;
      const existing = deviceMap.get(deviceId) || { name: deviceName, usage: 0 };
      deviceMap.set(deviceId, { name: existing.name, usage: existing.usage + ((t.rx_bytes || 0) + (t.tx_bytes || 0)) });
    });

    const data = Array.from(deviceMap.values()).map(d => ({ deviceName: d.name, usage: d.usage / (1024 * 1024 * 1024) }));
    res.json({ data });
  } catch (err) {
    console.error('Legacy /device-usage error:', err);
    res.status(500).json({ error: 'Failed to fetch device usage' });
  }
});

// Legacy: GET /api/statistics/top-devices -> compute from devices table
router.get('/top-devices', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('devices')
      .select('hostname, mac_address, rx_bytes_total, tx_bytes_total')
      .order('rx_bytes_total', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    const mapped = (data || []).map((d: any) => ({ 
      deviceName: d.hostname || d.mac_address, 
      totalData: ((d.rx_bytes_total || 0) + (d.tx_bytes_total || 0)) / (1024 * 1024 * 1024) 
    }));
    res.json({ data: mapped });
  } catch (err) {
    console.error('Legacy /top-devices error:', err);
    res.status(500).json({ error: 'Failed to fetch top devices' });
  }
});

// Legacy: GET /api/statistics/hourly-patterns
router.get('/hourly-patterns', async (req: Request, res: Response) => {
  try {
    const start = parseRangeToStart(req.query.range as string | undefined);
    const { data: telemetry, error } = await supabaseAdmin
      .from('telemetry_data')
      .select('timestamp, rx_bytes, tx_bytes')
      .gte('timestamp', start);

    if (error) throw error;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets = new Map<string, number>();

    (telemetry || []).forEach((t: any) => {
      const date = new Date(t.timestamp);
      const dayIndex = (date.getDay() + 6) % 7;
      const day = days[dayIndex];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      buckets.set(key, (buckets.get(key) || 0) + ((t.rx_bytes || 0) + (t.tx_bytes || 0)));
    });

    const data: { hour: number; day: string; value: number }[] = [];
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        data.push({ hour, day, value: (buckets.get(key) || 0) / (1024 * 1024) });
      }
    });

    res.json({ data });
  } catch (err) {
    console.error('Legacy /hourly-patterns error:', err);
    res.status(500).json({ error: 'Failed to fetch hourly patterns' });
  }
});

export default router;
