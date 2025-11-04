"""
Data Parser for EdgeNet Agent
Transforms router device data into backend-compatible format
"""

import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class DataParser:
    """Parse and transform router device data"""
    
    @staticmethod
    def is_valid_mac(mac):
        """
        Validate MAC address format
        Accepts formats: AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF
        Case insensitive
        """
        if not mac or not isinstance(mac, str):
            return False
        
        # Match MAC address pattern (colon or hyphen separated)
        # Allows both uppercase and lowercase
        pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
        return bool(re.match(pattern, mac))
    
    @staticmethod
    def normalize_mac(mac):
        """
        Normalize MAC address to lowercase with colons
        AA:BB:CC:DD:EE:FF -> aa:bb:cc:dd:ee:ff
        """
        if not mac:
            return None
        
        # Remove any separators and convert to lowercase
        clean_mac = mac.replace(':', '').replace('-', '').lower()
        
        # Add colons every 2 characters
        if len(clean_mac) == 12:
            return ':'.join(clean_mac[i:i+2] for i in range(0, 12, 2))
        
        return mac.lower()  # Return original if can't normalize
    
    @staticmethod
    def parse_bytes(bytes_value):
        """
        Parse byte values from router
        Handles both integer and string formats
        """
        if bytes_value is None:
            return 0
        
        if isinstance(bytes_value, int):
            return bytes_value
        
        if isinstance(bytes_value, str):
            # Try to extract number from string like "123456 bytes"
            match = re.search(r'(\d+)', bytes_value)
            if match:
                return int(match.group(1))
        
        return 0
    
    @staticmethod
    def calculate_signal_percentage(rssi):
        """
        Convert RSSI to percentage
        Router already gives percentage (0-100), so just validate
        """
        if rssi is None:
            return None
        
        try:
            rssi_int = int(rssi)
            # Clamp between 0-100
            return max(0, min(100, rssi_int))
        except (ValueError, TypeError):
            return None
    
    def parse_device(self, raw_device):
        """
        Parse a single device from router format to backend format
        
        Router format (from JSON-RPC):
        {
            'mac': 'D8:80:83:CB:5F:13',
            'online': 67,
            'band': '2.4 GHz',
            'mode': '11n',
            'SSID': 'SOHAM',
            'lastTxRate': 300,
            'rssi': 74,
            'tx_bytes': 87585,
            'rx_bytes': 114475,
            'sleep': False,
            'hostname': 'JExTer',
            'ip': '192.168.0.180',
            'MACAddress': 'd8:80:83:cb:5f:13',  # Duplicate from DHCP
            ...
        }
        
        Backend format:
        {
            'hostname': 'JExTer',
            'mac': 'd8:80:83:cb:5f:13',
            'ipv4': '192.168.0.180',
            'ssid': 'SOHAM',
            'signal_level': 74,
            'band': '2.4 GHz',
            'wireless_mode': '802.11n',
            'online_seconds': 67,
            'last_tx_rate_mbps': 300,
            'rx_bytes': 114475,
            'tx_bytes': 87585,
            'power_saving': False,
            'timestamp': '2025-10-20T12:57:23Z'
        }
        """
        try:
            # Get MAC address (prefer WiFi data, fallback to DHCP)
            mac = raw_device.get('mac') or raw_device.get('MACAddress')
            
            if not mac:
                logger.warning(f'Device has no MAC address: {raw_device}')
                return None
            
            # Validate MAC
            if not self.is_valid_mac(mac):
                logger.warning(f'Invalid MAC format: {mac}')
                return None
            
            # Normalize MAC to lowercase with colons
            normalized_mac = self.normalize_mac(mac)
            
            # Get IP address (from DHCP data)
            ipv4 = raw_device.get('ip') or raw_device.get('ipv4')
            
            # Calculate minutes from seconds
            online_seconds = raw_device.get('online', 0)
            online_minutes = int(online_seconds / 60) if online_seconds else 0
            
            # Format bytes as strings (database expects VARCHAR)
            rx_bytes = self.parse_bytes(raw_device.get('rx_bytes'))
            tx_bytes = self.parse_bytes(raw_device.get('tx_bytes'))
            
            # Format TX rate as string with units
            last_tx_rate = raw_device.get('lastTxRate')
            last_tx_rate_str = f"{last_tx_rate} Mbps" if last_tx_rate else None
            
            # Build parsed device matching database schema
            parsed = {
                'hostname': raw_device.get('hostname', 'Unknown'),
                'mac': normalized_mac,
                'ipv4': ipv4,
                'ssid': raw_device.get('SSID'),
                'signal_level': self.calculate_signal_percentage(raw_device.get('rssi')),
                'band': raw_device.get('band'),
                'wireless_mode': self._format_wireless_mode(raw_device.get('mode')),
                'online_minutes': online_minutes,           # ← Fixed: minutes not seconds
                'last_tx_rate': last_tx_rate_str,          # ← Fixed: string with units
                'rx_bytes': str(rx_bytes),                 # ← Fixed: string not int
                'tx_bytes': str(tx_bytes),                 # ← Fixed: string not int
                'power_saving': raw_device.get('sleep', False),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
            # Add optional DHCP fields
            if 'vendorid' in raw_device:
                parsed['vendor_id'] = raw_device['vendorid']
            
            if 'lease' in raw_device:
                parsed['lease_remaining_seconds'] = int(raw_device['lease'])
            
            return parsed
            
        except Exception as e:
            logger.error(f'Error parsing device: {e}', exc_info=True)
            logger.debug(f'Raw device data: {raw_device}')
            return None
    
    def _format_wireless_mode(self, mode):
        """
        Format wireless mode to standard notation
        '11n' -> '802.11n'
        '11ac' -> '802.11ac'
        """
        if not mode:
            return None
        
        if isinstance(mode, str):
            if mode.startswith('11'):
                return f'802.{mode}'
            elif mode.startswith('802.11'):
                return mode
        
        return str(mode)
    
    def parse_devices(self, raw_devices):
        """
        Parse multiple devices
        Returns list of successfully parsed devices
        """
        if not raw_devices:
            return []
        
        parsed_devices = []
        
        for raw_device in raw_devices:
            parsed = self.parse_device(raw_device)
            if parsed:
                parsed_devices.append(parsed)
            else:
                logger.warning(f'Skipping device: {raw_device.get("mac")} / {raw_device.get("hostname")}')
        
        logger.info(f'Parsed {len(parsed_devices)} devices successfully')
        return parsed_devices