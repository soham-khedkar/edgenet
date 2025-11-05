# Configuration management for EdgeNet agent
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Agent configuration loaded from environment variables"""
    
    # Supabase settings (required for multi-tenant access)
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
    
    # Backend API settings
    BACKEND_API_URL: str = os.getenv('BACKEND_API_URL', 'http://localhost:4000/api/telemetry')
    
    # Agent behavior settings
    POLL_INTERVAL: int = int(os.getenv('POLL_INTERVAL', '30'))  # Seconds between polling all routers
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # HTTP request timeout
    REQUEST_TIMEOUT: int = 10  # Seconds
    
    # Retry configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 5  # Seconds
    
    @classmethod
    def validate(cls) -> None:
        """Validate required configuration is present"""
        if not cls.SUPABASE_URL or not cls.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for multi-tenant agent')
        if not cls.BACKEND_API_URL:
            raise ValueError('BACKEND_API_URL must be set')

# Validate config on import
Config.validate()
