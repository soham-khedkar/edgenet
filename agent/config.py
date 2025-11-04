# Configuration management for EdgeNet agent
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Agent configuration loaded from environment variables"""
    
    # Router settings
    ROUTER_IP: str = os.getenv('ROUTER_IP', '192.168.0.1')
    ROUTER_USERNAME: str = os.getenv('ROUTER_USERNAME', 'admin')
    ROUTER_PASSWORD: str = os.getenv('ROUTER_PASSWORD', '')
    ROUTER_URL: str = f'http://{ROUTER_IP}'  # Base URL without admin path
    
    # JSON-RPC endpoint for D-Link router (not used anymore, using REST API)
    # RPC_ENDPOINT: str = f'{ROUTER_URL}/JNAP/'
    
    # Backend API settings
    BACKEND_API_URL: str = os.getenv('BACKEND_API_URL', 'http://localhost:4000/api/telemetry')
    
    # Agent behavior settings
    POLL_INTERVAL: int = int(os.getenv('POLL_INTERVAL', '30'))  # Seconds between scans
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # HTTP request timeout
    REQUEST_TIMEOUT: int = 10  # Seconds
    
    # Retry configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 5  # Seconds

    @classmethod
    def validate(cls) -> None:
        """Validate required configuration is present"""
        if not cls.ROUTER_PASSWORD:
            raise ValueError('ROUTER_PASSWORD must be set in .env file')
        if not cls.BACKEND_API_URL:
            raise ValueError('BACKEND_API_URL must be set in .env file')

# Validate config on import
Config.validate()
