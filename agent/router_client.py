"""
Router Client for D-Link DIR-615
Handles custom anweb-authenticate digest authentication
"""

import requests
import hashlib
import time
import logging
import re
from config import Config

logger = logging.getLogger(__name__)


class RouterClient:
    """D-Link DIR-615 JSON-RPC Client with custom digest auth"""
    
    def __init__(self, router_ip=None, username=None, password=None):
        self.session = requests.Session()
        self.logged_in = False
        self.session_cookies = {}
        self.auth_params = {}
        self.nc = 0
        
        # Use provided values or fallback to Config
        self.base_url = f'http://{router_ip}' if router_ip else getattr(Config, 'ROUTER_URL', 'http://192.168.0.1')
        self.username = username if username else getattr(Config, 'ROUTER_USERNAME', 'admin')
        self.password = password if password else getattr(Config, 'ROUTER_PASSWORD', '')
        
        # Set base headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json;charset=UTF-8',
            'Origin': self.base_url,
            'Referer': f'{self.base_url}/admin/index.html',
            'Connection': 'keep-alive'
        })
    
    def _parse_auth_header(self, header):
        """Parse anweb-authenticate header"""
        params = {}
        # Match key="value" or key=value patterns
        pattern = r'(\w+)=(?:"([^"]+)"|([^,\s]+))'
        matches = re.findall(pattern, header)
        
        for match in matches:
            key = match[0]
            value = match[1] if match[1] else match[2]
            params[key] = value
        
        return params
    
    def _calculate_digest(self, username, password, method, uri, realm, nonce, qop='auth'):
        """Calculate digest authentication response"""
        # Increment nonce count
        self.nc += 1
        nc_value = f'{self.nc:08x}'
        
        # Generate cnonce (client nonce)
        cnonce = hashlib.md5(str(time.time()).encode()).hexdigest()[:16]
        
        # Calculate HA1 = MD5(username:realm:password)
        ha1 = hashlib.md5(f'{username}:{realm}:{password}'.encode()).hexdigest()
        
        # Calculate HA2 = MD5(method:uri)
        ha2 = hashlib.md5(f'{method}:{uri}'.encode()).hexdigest()
        
        # Calculate response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
        if qop:
            response_str = f'{ha1}:{nonce}:{nc_value}:{cnonce}:{qop}:{ha2}'
        else:
            response_str = f'{ha1}:{nonce}:{ha2}'
        
        response = hashlib.md5(response_str.encode()).hexdigest()
        
        return {
            'username': username,
            'realm': realm,
            'nonce': nonce,
            'uri': uri,
            'qop': qop,
            'nc': nc_value,
            'cnonce': cnonce,
            'response': response
        }
    
    def _build_auth_header(self, digest_params):
        """Build Authorization header from digest parameters"""
        auth_parts = [
            f'username="{digest_params["username"]}"',
            f'realm="{digest_params["realm"]}"',
            f'nonce="{digest_params["nonce"]}"',
            f'uri="{digest_params["uri"]}"',
            f'response="{digest_params["response"]}"',
            f'qop={digest_params["qop"]}',
            f'nc={digest_params["nc"]}',
            f'cnonce="{digest_params["cnonce"]}"'
        ]
        return f'Digest {", ".join(auth_parts)}'
    
    def login(self):
        """Login to router and establish session"""
        try:
            logger.info('Attempting to login to router...')
            
            # Step 1: Get authentication challenge
            auth_url = f'{self.base_url}/devinfo?need_auth=1'
            logger.debug(f'Requesting auth challenge from: {auth_url}')
            
            response = self.session.get(auth_url, timeout=10)
            
            # Check for auth challenge (401 expected)
            if response.status_code != 401:
                logger.error(f'Expected 401, got {response.status_code}')
                logger.debug(f'Response headers: {dict(response.headers)}')
                return False
            
            # Get auth parameters
            auth_header = response.headers.get('anweb-authenticate')
            if not auth_header:
                logger.error('No anweb-authenticate header found!')
                logger.debug(f'Available headers: {list(response.headers.keys())}')
                return False
            
            logger.debug(f'Auth header: {auth_header}')
            self.auth_params = self._parse_auth_header(auth_header)
            
            realm = self.auth_params.get('realm', 'domain')
            nonce = self.auth_params.get('nonce')
            qop = self.auth_params.get('qop', 'auth')
            
            if not nonce:
                logger.error('No nonce in auth challenge!')
                return False
            
            logger.info(f'Auth challenge received: realm={realm}, nonce={nonce}')
            
            # Save session cookie
            if 'device-session-id' in response.cookies:
                session_id = response.cookies['device-session-id']
                self.session_cookies['device-session-id'] = session_id
                logger.debug(f'Session ID: {session_id}')
            
            # Step 2: Calculate digest and make authenticated request
            # Try authenticating to /jsonrpc endpoint
            digest = self._calculate_digest(
                username=self.username,
                password=self.password,
                method='POST',
                uri='/jsonrpc',
                realm=realm,
                nonce=nonce,
                qop=qop
            )
            
            auth_header = self._build_auth_header(digest)
            logger.debug(f'Authorization header: {auth_header}')
            
            # Update session headers with auth
            self.session.headers['Authorization'] = auth_header
            
            # Make test JSON-RPC call to verify login
            test_payload = {
                'jsonrpc': '2.0',
                'method': 'read',
                'params': {'id': 64},
                'id': int(time.time() * 1000)
            }
            
            logger.debug('Testing authentication with JSON-RPC call...')
            jsonrpc_response = self.session.post(
                f'{self.base_url}/jsonrpc',
                json=test_payload,
                timeout=10
            )
            
            logger.debug(f'JSON-RPC response status: {jsonrpc_response.status_code}')
            
            if jsonrpc_response.status_code == 200:
                self.logged_in = True
                logger.info('✅ Successfully authenticated to router!')
                
                # Set additional cookies that might be needed
                self.session.cookies.set('user_login', self.username)
                self.session.cookies.set('device_mode', 'router')
                
                return True
            
            elif jsonrpc_response.status_code == 401:
                logger.error('❌ Authentication failed - 401 Unauthorized')
                logger.debug(f'Response: {jsonrpc_response.text}')
                logger.debug(f'Response headers: {dict(jsonrpc_response.headers)}')
                
                # Try to get more details from response
                if 'anweb-authenticate' in jsonrpc_response.headers:
                    logger.debug(f'New auth challenge: {jsonrpc_response.headers["anweb-authenticate"]}')
                
                return False
            
            else:
                logger.error(f'Unexpected response code: {jsonrpc_response.status_code}')
                logger.debug(f'Response: {jsonrpc_response.text[:500]}')
                return False
                
        except requests.exceptions.Timeout:
            logger.error('Connection timeout - is router reachable?')
            return False
        except requests.exceptions.ConnectionError as e:
            logger.error(f'Connection error: {e}')
            return False
        except Exception as e:
            logger.error(f'Login error: {e}', exc_info=True)
            return False
    
    def _jsonrpc_call(self, method, params, request_id=None, max_retries=3):
        """Make a JSON-RPC 2.0 call with proper authentication and retry logic"""
        if not self.logged_in:
            logger.warning('Not logged in, attempting login...')
            if not self.login():
                return None
        
        if request_id is None:
            request_id = int(time.time() * 1000)
        
        payload = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params,
            'id': request_id
        }
        
        for attempt in range(max_retries):
            try:
                response = self.session.post(
                    f'{self.base_url}/jsonrpc',
                    json=payload,
                    timeout=15  # Increased timeout
                )
                
                # Handle session expiration
                if response.status_code == 401:
                    logger.warning('Session expired (401), re-authenticating...')
                    self.logged_in = False
                    if self.login():
                        # Retry request
                        response = self.session.post(
                            f'{self.base_url}/jsonrpc',
                            json=payload,
                            timeout=15
                        )
                    else:
                        logger.error('Re-authentication failed')
                        return None
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f'JSON-RPC call failed: {response.status_code}')
                    logger.debug(f'Response: {response.text[:200]}')
                    return None
                    
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    logger.warning(f'Request timeout, retry {attempt + 1}/{max_retries}...')
                    time.sleep(2)  # Wait before retry
                    continue
                else:
                    logger.error('Max retries reached, request failed')
                    return None
                    
            except requests.exceptions.ConnectionError as e:
                if attempt < max_retries - 1:
                    logger.warning(f'Connection error, retry {attempt + 1}/{max_retries}...')
                    time.sleep(2)
                    continue
                else:
                    logger.error(f'Connection failed after {max_retries} attempts')
                    return None
                    
            except Exception as e:
                logger.error(f'JSON-RPC call error: {e}')
                return None
        
        return None
    
    def get_wifi_clients(self):
        """Get WiFi client list"""
        logger.debug('Fetching WiFi clients (id=64)...')
        result = self._jsonrpc_call('read', {'id': 64})
        
        if result and 'result' in result:
            data = result.get('result', {}).get('data', [])
            logger.debug(f'Found {len(data)} WiFi clients')
            return data
        
        logger.debug('No WiFi clients data')
        return []
    
    def get_dhcp_leases(self):
        """Get DHCP lease information"""
        logger.debug('Fetching DHCP leases (id=34)...')
        result = self._jsonrpc_call('read', {'id': 34})
        
        if result and 'result' in result:
            data = result.get('result', {}).get('data', [])
            logger.debug(f'Found {len(data)} DHCP leases')
            return data
        
        logger.debug('No DHCP lease data')
        return []
    
    def get_connected_devices(self):
        """
        Get all connected devices by combining WiFi and DHCP data
        Returns list of device dicts with merged data
        """
        try:
            # Get both data sources
            wifi_clients = self.get_wifi_clients()
            dhcp_leases = self.get_dhcp_leases()
            
            # Create DHCP lookup by MAC
            dhcp_map = {}
            for lease in dhcp_leases:
                mac = lease.get('MACAddress', '').upper()
                if mac:
                    dhcp_map[mac] = lease
            
            # Merge data
            devices = []
            for client in wifi_clients:
                mac = client.get('mac', '').upper()
                
                # Start with WiFi data
                device = dict(client)  # Copy all WiFi fields
                
                # Add DHCP data if available
                if mac in dhcp_map:
                    device.update(dhcp_map[mac])
                
                devices.append(device)
            
            logger.info(f'Combined data: {len(devices)} devices total')
            return devices
            
        except Exception as e:
            logger.error(f'Error getting devices: {e}', exc_info=True)
            return None
    
    def get_mac_filters(self):
        """Get list of MAC filters (blocked devices)"""
        try:
            payload = {
                "id": 550,
                "jsonrpc": "2.0",
                "method": "read",
                "params": {
                    "id": 42  # D-Link MAC filter table ID
                }
            }
            response = self._jsonrpc_call("read", payload["params"], request_id=payload["id"])
            
            if response and response.get('success'):
                result = response.get('result', {})
                # Extract MAC filter list
                mac_filters = result.get('MacFilterList', [])
                if not isinstance(mac_filters, list):
                    mac_filters = [mac_filters] if mac_filters else []
                return mac_filters
            return []
        except Exception as e:
            logger.error(f'Error getting MAC filters: {e}', exc_info=True)
            return []
    
    def is_mac_blocked(self, mac):
        """Check if a MAC address is already in the filter list"""
        filters = self.get_mac_filters()
        mac_lower = mac.lower()
        for filter_entry in filters:
            if isinstance(filter_entry, dict):
                filter_mac = filter_entry.get('mac', '').lower()
                if filter_mac == mac_lower:
                    return True
        return False
    
    def add_mac_filter(self, mac, hostname):
        """Add a MAC filter (block device) - prevents duplicates"""
        try:
            # Check if already blocked
            logger.info(f'Checking if {mac} is already blocked...')
            if self.is_mac_blocked(mac):
                logger.info(f'Device {mac} is already blocked, skipping duplicate')
                return {
                    'success': True,
                    'message': f'Device {mac} is already blocked',
                    'already_blocked': True
                }
            
            logger.info(f'Device {mac} not blocked yet, adding to filter list...')
            payload = {
                "id": 551,
                "jsonrpc": "2.0",
                "method": "write",
                "params": {
                    "id": 42,  # D-Link MAC filter table ID
                    "pos": -1,
                    "data": {
                    "MacFilterList": {"mac": mac, "hostname": hostname, "active": True}
                    },
                    "save": True
                }
            }
            response = self._jsonrpc_call("write", payload["params"], request_id=payload["id"])
            
            logger.info(f'Router response: {response}')
            
            # Check response format - D-Link returns status in result, not success
            if response and 'result' in response:
                result = response.get('result', {})
                status = result.get('status', 0)
                
                if status == 0:
                    logger.info(f'Successfully added MAC filter for {mac}')
                    return {
                        'success': True,
                        'message': f'Successfully blocked device {mac}',
                        'already_blocked': False
                    }
                elif status == 20:
                    logger.error(f'Router requires wired connection to add MAC filter (status: {status})')
                    return {
                        'success': False,
                        'message': 'Router requires WIRED (Ethernet) connection to add MAC filters. Please connect via Ethernet cable and try again.',
                        'status': status
                    }
                else:
                    logger.error(f'Router returned error status: {status}')
                    return {
                        'success': False,
                        'message': f'Router error: status code {status}',
                        'status': status
                    }
            
            logger.error(f'Invalid response format: {response}')
            return {
                'success': False,
                'message': 'Failed to communicate with router'
            }
        except Exception as e:
            logger.error(f'Exception in add_mac_filter: {e}', exc_info=True)
            return {
                'success': False,
                'message': str(e)
            }

    def get_qos_settings(self):
        """Get QoS bandwidth allocation settings"""
        try:
            payload = {
                "id": 600,
                "jsonrpc": "2.0",
                "method": "read",
                "params": {
                    "id": 230  # WAN bandwidth control table ID
                }
            }
            response = self._jsonrpc_call("read", payload["params"], request_id=payload["id"])
            
            logger.info(f'QoS settings response: {response}')
            
            if response and 'result' in response:
                return response.get('result', {})
            return None
        except Exception as e:
            logger.error(f'Error getting QoS settings: {e}', exc_info=True)
            return None
    
    def set_bandwidth_limit(self, port_settings):
        """
        Set bandwidth limit for router ports (QoS)
        
        Args:
            port_settings: Dict with port names as keys (WAN, LAN1, LAN2, LAN3, LAN4)
                          Each value is dict with: max_bandwidth, ingress_bandwidth, egress_bandwidth
                          Example: {
                              "WAN": {"max_bandwidth": 100000, "ingress_bandwidth": -1, "egress_bandwidth": 100000},
                              "LAN1": {"max_bandwidth": 100000, "ingress_bandwidth": -1, "egress_bandwidth": 100000}
                          }
        """
        try:
            # Generate dynamic request ID (like router does)
            import random
            request_id = random.randint(100, 999)
            
            payload = {
                "id": request_id,
                "jsonrpc": "2.0",
                "method": "write",
                "params": {
                    "id": 230,  # Table 230 = Bandwidth control (this is constant)
                    "data": port_settings,
                    "save": True
                }
            }
            
            logger.info(f'Setting bandwidth with payload: {payload}')
            response = self._jsonrpc_call("write", payload["params"], request_id=payload["id"])
            
            logger.info(f'Bandwidth write response: {response}')
            
            if response and 'result' in response:
                result = response.get('result', {})
                status = result.get('status', -1)
                
                # Status 20 appears in both successful reads and writes
                # Check if we got an actual error or if the operation succeeded
                if status in [0, 20]:  # 0 = success, 20 = appears on reads/writes
                    logger.info(f'✅ Successfully set bandwidth limits for ports: {list(port_settings.keys())}')
                    return {
                        'success': True,
                        'message': 'Bandwidth limits updated successfully',
                        'status': status
                    }
                else:
                    logger.error(f'Router returned error status: {status}')
                    return {
                        'success': False,
                        'message': f'Router error: status code {status}',
                        'status': status
                    }
            
            return {
                'success': False,
                'message': 'Invalid response from router'
            }
        except Exception as e:
            logger.error(f'Error setting bandwidth limit: {e}', exc_info=True)
            return {
                'success': False,
                'message': str(e)
            }
    
    def get_bandwidth_usage(self, mac=None):
        """Get current bandwidth usage statistics for device(s)"""
        try:
            # Get all connected devices first
            devices = self.get_connected_devices()
            if not devices:
                return None
            
            # If MAC specified, filter for that device
            if mac:
                devices = [d for d in devices if d.get('mac', '').lower() == mac.lower()]
            
            # Add bandwidth usage info (from router stats)
            bandwidth_stats = []
            for device in devices:
                stats = {
                    'mac': device.get('mac'),
                    'hostname': device.get('hostname'),
                    'ip': device.get('ip'),
                    'tx_bytes': device.get('tx_bytes', 0),  # Bytes sent
                    'rx_bytes': device.get('rx_bytes', 0),  # Bytes received
                    'tx_packets': device.get('tx_packets', 0),
                    'rx_packets': device.get('rx_packets', 0),
                }
                bandwidth_stats.append(stats)
            
            return bandwidth_stats
        except Exception as e:
            logger.error(f'Error getting bandwidth usage: {e}', exc_info=True)
            return None

    
    def logout(self):
        """Cleanup session"""
        try:
            if self.logged_in:
                # D-Link routers typically auto-logout on session expiry
                # No explicit logout endpoint needed
                logger.info('Logged out of router')
                self.logged_in = False
        except Exception as e:
            logger.debug(f'Logout error (non-critical): {e}')
