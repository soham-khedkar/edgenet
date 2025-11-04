# Backend API client - Sends device data to EdgeNet backend
import requests
import logging
from typing import List, Dict
from tenacity import retry, stop_after_attempt, wait_fixed
from config import Config

logger = logging.getLogger(__name__)

class BackendClient:
    """Handles communication with EdgeNet backend API"""
    
    def __init__(self):
        self.api_url = Config.BACKEND_API_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
    
    @retry(
        stop=stop_after_attempt(Config.MAX_RETRIES),
        wait=wait_fixed(Config.RETRY_DELAY),
        reraise=True
    )
    def send_telemetry(self, devices: List[Dict]) -> bool:
        """
        Send device telemetry data to backend API
        Uses retry logic for network resilience
        
        Args:
            devices: List of parsed device dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        if not devices:
            logger.warning('No devices to send')
            return False
        
        try:
            # Prepare payload matching backend API format
            payload = {
                'devices': devices,
                'timestamp': devices[0].get('timestamp') if devices else None
            }
            
            # POST to backend telemetry endpoint
            response = self.session.post(
                self.api_url,
                json=payload,
                timeout=Config.REQUEST_TIMEOUT
            )
            
            # Check response
            if response.status_code == 200:
                data = response.json()
                logger.info(f'✓ Sent {data.get("count", len(devices))} devices to backend')
                return True
            else:
                logger.error(f'Backend returned {response.status_code}: {response.text}')
                return False
                
        except requests.exceptions.Timeout:
            logger.error('Backend request timed out')
            raise  # Trigger retry
            
        except requests.exceptions.ConnectionError:
            logger.error('Failed to connect to backend')
            raise  # Trigger retry
            
        except Exception as e:
            logger.error(f'Error sending telemetry: {e}')
            return False
    
    def test_connection(self) -> bool:
        """
        Test connection to backend API health endpoint
        Returns True if backend is reachable
        """
        try:
            # Extract base URL from telemetry endpoint
            base_url = self.api_url.replace('/api/telemetry', '')
            health_url = f'{base_url}/health'
            
            response = self.session.get(health_url, timeout=5)
            
            if response.status_code == 200:
                logger.info('✓ Backend API is reachable')
                return True
            else:
                logger.warning(f'Backend health check returned {response.status_code}')
                return False
                
        except Exception as e:
            logger.error(f'Backend connection test failed: {e}')
            return False
