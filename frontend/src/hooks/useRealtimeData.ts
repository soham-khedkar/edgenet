'use client';

import { useEffect, useState } from 'react';

const AGENT_API_URL = 'http://localhost:5000';

export function useRealtimeDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchDevices = async () => {
    try {
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced from 5s to 3s

      try {
        const response = await fetch(`${AGENT_API_URL}/devices`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Service not responding correctly');
        }

        const data = await response.json();

        // Handle both success wrapper and direct response formats
        if (data.success !== false) {
          setDevices(data.devices || []);
          setConnected(data.connected || false);
          // Clear error if we successfully connected
          if (data.connected) {
            setError(null);
          }
          setLoading(false);
        } else {
          setError(data.message || 'Failed to fetch devices');
          setConnected(false);
          setDevices([]);
          setLoading(false);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          setError('Service timeout');
        } else {
          throw fetchError; // Re-throw non-abort errors
        }
        setConnected(false);
        setDevices([]);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setConnected(false);
      setDevices([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    setLoading(true);
    fetchDevices();

    // Poll every 15 seconds for real-time updates (faster polling)
    const interval = setInterval(fetchDevices, 15000);

    return () => clearInterval(interval);
  }, []);

  return { devices, loading, error, connected, refetch: fetchDevices };
}
