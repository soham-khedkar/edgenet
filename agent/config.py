# Configuration management for EdgeNet agent
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Agent configuration loaded from environment variables"""
    
    # Supabase settings (required for cloud-based config)
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY: str = os.getenv('SUPABASE_KEY', '')
    
    # User authentication (to fetch router config from Supabase)
    USER_EMAIL: str = os.getenv('USER_EMAIL', '')
    USER_PASSWORD: str = os.getenv('USER_PASSWORD', '')
    
    # Router settings (fallback if cloud config not available)
    ROUTER_IP: str = os.getenv('ROUTER_IP', '192.168.0.1')
    ROUTER_USERNAME: str = os.getenv('ROUTER_USERNAME', 'admin')
    ROUTER_PASSWORD: str = os.getenv('ROUTER_PASSWORD', '')
    ROUTER_URL: str = f'http://{ROUTER_IP}'
    
    # Backend API settings
    BACKEND_API_URL: str = os.getenv('BACKEND_API_URL', 'http://localhost:4000/api/telemetry')
    
    # Agent behavior settings
    POLL_INTERVAL: int = int(os.getenv('POLL_INTERVAL', '30'))
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # HTTP request timeout
    REQUEST_TIMEOUT: int = 10
    
    # Retry configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 5
    
    @classmethod
    def update_from_cloud_config(cls, router_config: dict) -> None:
        """Update configuration from Supabase user_router_configs"""
        cls.ROUTER_IP = router_config.get('router_ip', cls.ROUTER_IP)
        cls.ROUTER_USERNAME = router_config.get('username', cls.ROUTER_USERNAME)
        cls.ROUTER_PASSWORD = router_config.get('password', cls.ROUTER_PASSWORD)
        cls.ROUTER_URL = f'http://{cls.ROUTER_IP}'
        cls.POLL_INTERVAL = router_config.get('polling_interval', cls.POLL_INTERVAL)
    
    @classmethod
    def validate(cls) -> None:
        """Validate required configuration is present"""
        # Only require Supabase credentials if trying to use cloud config
        if cls.USER_EMAIL and cls.USER_PASSWORD:
            if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
                raise ValueError('SUPABASE_URL and SUPABASE_KEY required when using cloud config')

# Validate config on import
Config.validate()
