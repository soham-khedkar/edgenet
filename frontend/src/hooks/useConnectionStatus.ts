'use client';

import { useEffect, useState } from 'react';

const AGENT_API_URL = 'http://localhost:5000';

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    if (isChecking) return; // Prevent concurrent checks
    
    setIsChecking(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${AGENT_API_URL}/status`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setIsConnected(data.connected || false);
      } else {
        setIsConnected(false);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, checkStatus };
}
