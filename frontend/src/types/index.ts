// Type definitions for EdgeNet frontend

export interface Device {
  id?: string;
  hostname?: string;
  mac_address: string;  // Database uses mac_address
  mac?: string;         // Keep for backward compatibility
  ip_address?: string;  // Database uses ip_address
  ipv4?: string;        // Keep for backward compatibility
  signal_strength?: number;  // Database uses signal_strength
  signal_level?: number;     // Keep for backward compatibility
  band?: string;
  connection_status?: string;
  device_type?: string;
  manufacturer?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  is_blocked?: boolean;
  custom_name?: string;
  notes?: string;
  // Router-provided fields
  ssid?: string;
  wireless_mode?: string;
  last_tx_rate?: string;
  rx_bytes_total?: number;
  tx_bytes_total?: number;
  online_minutes?: number;
  power_saving?: boolean;
  // Legacy fields
  rx_bytes?: string;
  tx_bytes?: string;
}

export interface DevicesResponse {
  count: number;
  devices: Device[];
}

export interface TelemetryPayload {
  timestamp: string;
  devices: Device[];
}
