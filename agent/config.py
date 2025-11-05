# Configuration management for EdgeNet agent
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Agent configuration loaded from environment variables and Supabase"""
    
    # Supabase settings (required for cloud-based config)
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY: str = os.getenv('SUPABASE_KEY', '')
    
    # Supabase Auth credentials (to fetch router config)
    USER_EMAIL: str = os.getenv('USER_EMAIL', '')
    USER_PASSWORD: str = os.getenv('USER_PASSWORD', '')
    
    # Router settings (fallback to env vars if Supabase config not available)
    ROUTER_IP: str = os.getenv('ROUTER_IP', '192.168.0.1')
    ROUTER_USERNAME: str = os.getenv('ROUTER_USERNAME', 'admin')
    ROUTER_PASSWORD: str = os.getenv('ROUTER_PASSWORD', '')
    ROUTER_URL: str = f'http://{ROUTER_IP}'  # Will be updated from Supabase config
    
    # Backend API settings
    BACKEND_API_URL: str = os.getenv('BACKEND_API_URL', 'http://localhost:4000/api/telemetry')
    
    # Agent behavior settings
    POLL_INTERVAL: int = 30  # Default, will be updated from Supabase config
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # HTTP request timeout
    REQUEST_TIMEOUT: int = 10  # Seconds
    
    # Retry configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 5  # Seconds
    
    # Flag to track if config is loaded from Supabase
    _config_loaded_from_cloud: bool = False

    @classmethod
    def update_from_cloud_config(cls, router_config: dict) -> None:
        """
        Update configuration from Supabase user_router_configs
        Called after authenticating and fetching user's router config
        """
        cls.ROUTER_IP = router_config.get('router_ip', cls.ROUTER_IP)
        cls.ROUTER_USERNAME = router_config.get('username', cls.ROUTER_USERNAME)
        cls.ROUTER_PASSWORD = router_config.get('password', cls.ROUTER_PASSWORD)
        cls.ROUTER_URL = f'http://{cls.ROUTER_IP}'
        cls.POLL_INTERVAL = router_config.get('polling_interval', cls.POLL_INTERVAL)
        cls._config_loaded_from_cloud = True
    
    @classmethod
    def validate(cls) -> None:
        """Validate required configuration is present"""
        if not cls.USER_EMAIL or not cls.USER_PASSWORD:
            raise ValueError('USER_EMAIL and USER_PASSWORD must be set (for Supabase auth)')
        if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
            raise ValueError('SUPABASE_URL and SUPABASE_KEY must be set')

# Validate config on import
Config.validate()
