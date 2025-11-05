#!/usr/bin/env python3
"""
EdgeNet Agent API - Flask server for router operations
Provides endpoints for the backend to test router connections
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
import logging
import json
import os
import time
import requests
from router_client import RouterClient
from config import Config
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes with wildcard

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Global variables for Supabase authentication
_supabase_client: Client = None
_user_id: str = None
_auth_token: str = None

# Path to store router config persistently (works in Docker and locally)
CONFIG_DIR = os.getenv('CONFIG_DIR', os.path.join(os.path.dirname(__file__), 'data'))
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, 'router_config.json')

def load_saved_config():
    """Load saved router configuration from file"""
    try:
        if os.path.exists(CONFIG_FILE_PATH):
            with open(CONFIG_FILE_PATH, 'r') as f:
                saved_config = json.load(f)
                # Update Config with saved values
                if 'routerIp' in saved_config:
                    Config.ROUTER_URL = f"http://{saved_config['routerIp']}"
                if 'username' in saved_config:
                    Config.ROUTER_USERNAME = saved_config['username']
                if 'password' in saved_config:
                    Config.ROUTER_PASSWORD = saved_config['password']
                logger.info(f"✅ Loaded saved router config from {CONFIG_FILE_PATH}")
                return saved_config
    except Exception as e:
        logger.warning(f"Could not load saved config: {e}")
    return None

def save_config_to_file(config_data):
    """Save router configuration to persistent file"""
    try:
        os.makedirs(os.path.dirname(CONFIG_FILE_PATH), exist_ok=True)
        with open(CONFIG_FILE_PATH, 'w') as f:
            json.dump(config_data, f, indent=2)
        logger.info(f"✅ Saved router config to {CONFIG_FILE_PATH}")
        return True
    except Exception as e:
        logger.error(f"Failed to save config: {e}")
        return False

# Load saved config on startup
load_saved_config()

# Path for storing auth session
SESSION_FILE_PATH = os.path.join(CONFIG_DIR, 'session.json')

def save_auth_session(session_data):
    """Save Supabase session (refresh token) to file"""
    try:
        os.makedirs(os.path.dirname(SESSION_FILE_PATH), exist_ok=True)
        session_info = {
            'refresh_token': session_data.refresh_token,
            'user_id': session_data.user.id,
            'email': session_data.user.email,
            'expires_at': session_data.expires_at
        }
        with open(SESSION_FILE_PATH, 'w') as f:
            json.dump(session_info, f, indent=2)
        logger.info(f"✅ Saved auth session to {SESSION_FILE_PATH}")
        return True
    except Exception as e:
        logger.error(f"Failed to save session: {e}")
        return False

def load_auth_session():
    """Load saved Supabase session"""
    try:
        if os.path.exists(SESSION_FILE_PATH):
            with open(SESSION_FILE_PATH, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load saved session: {e}")
    return None

# Supabase authentication
def authenticate_to_supabase():
    """Authenticate to Supabase and get user_id (uses refresh token if available)"""
    global _supabase_client, _user_id, _auth_token
    
    try:
        if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
            logger.warning("⚠️ Supabase credentials not configured")
            return False
        
        # Create Supabase client
        _supabase_client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        
        # Try to use saved refresh token first
        saved_session = load_auth_session()
        if saved_session and 'refresh_token' in saved_session:
            try:
                logger.info("🔄 Attempting to refresh session with saved token...")
                auth_response = _supabase_client.auth.set_session(
                    saved_session['refresh_token'],
                    saved_session.get('access_token', '')
                )
                
                if auth_response.user:
                    _user_id = auth_response.user.id
                    _auth_token = auth_response.session.access_token
                    logger.info(f"✅ Authenticated using saved session for {saved_session.get('email', 'user')}")
                    logger.info(f"✅ User ID: {_user_id}")
                    # Update session file with new tokens
                    save_auth_session(auth_response.session)
                    return True
            except Exception as e:
                logger.warning(f"⚠️ Saved session expired or invalid: {e}")
                logger.info("🔄 Falling back to email/password authentication...")
        
        # Fallback: Sign in with email/password
        if not Config.USER_EMAIL or not Config.USER_PASSWORD:
            logger.warning("⚠️ USER_EMAIL or USER_PASSWORD not configured")
            logger.warning("💡 Please add credentials to .env or ensure session.json exists")
            return False
        
        auth_response = _supabase_client.auth.sign_in_with_password({
            "email": Config.USER_EMAIL,
            "password": Config.USER_PASSWORD
        })
        
        if auth_response.user:
            _user_id = auth_response.user.id
            _auth_token = auth_response.session.access_token
            logger.info(f"✅ Authenticated to Supabase as {Config.USER_EMAIL}")
            logger.info(f"✅ User ID: {_user_id}")
            
            # Save session for future use
            save_auth_session(auth_response.session)
            logger.info("💾 Session saved - you can now remove USER_PASSWORD from .env for security")
            
            return True
        else:
            logger.error("❌ Supabase authentication failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Supabase authentication error: {e}")
        return False

def fetch_router_config_from_supabase():
    """
    Fetch router configuration from user_router_configs table in Supabase
    Updates Config class with cloud-based settings
    """
    global _supabase_client, _user_id
    
    if not _supabase_client or not _user_id:
        logger.warning("⚠️ Not authenticated to Supabase, cannot fetch router config")
        return False
    
    try:
        logger.info("🔍 Fetching router configuration from Supabase...")
        
        # Query user_router_configs for this user
        response = _supabase_client.table('user_router_configs') \
            .select('*') \
            .eq('user_id', _user_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            router_config = response.data[0]
            
            # Update Config class with cloud settings
            Config.update_from_cloud_config(router_config)
            
            logger.info(f"✅ Router config loaded from cloud:")
            logger.info(f"   Router IP: {Config.ROUTER_IP}")
            logger.info(f"   Username: {Config.ROUTER_USERNAME}")
            logger.info(f"   Poll Interval: {Config.POLL_INTERVAL}s")
            
            # Update router URL
            Config.ROUTER_URL = f'http://{Config.ROUTER_IP}'
            
            return True
        else:
            logger.warning("⚠️ No router config found in Supabase for this user")
            logger.info("💡 Using fallback config from environment variables")
            logger.info(f"   Router IP: {Config.ROUTER_IP}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error fetching router config from Supabase: {e}")
        logger.info("💡 Using fallback config from environment variables")
        return False

# Authenticate on startup and fetch router config
if authenticate_to_supabase():
    fetch_router_config_from_supabase()

# Global router client instance (reuse session)
_router_client = None
_last_login_time = 0
SESSION_TIMEOUT = 300  # 5 minutes

def get_router_client():
    """Get or create a persistent router client with session reuse"""
    global _router_client, _last_login_time
    
    current_time = time.time()
    
    # Create new client if none exists or session expired
    if _router_client is None or (current_time - _last_login_time) > SESSION_TIMEOUT:
        _router_client = RouterClient()
        if _router_client.login():
            _last_login_time = current_time
            logger.info("✅ Established new router session")
        else:
            logger.error("❌ Failed to establish router session")
            return None
    
    return _router_client

# ============================================
# BACKGROUND CRON JOB - Push data to backend
# ============================================

def normalize_device_data(device):
    """
    Normalize router device data to match backend expected format
    Maps D-Link router fields to backend schema
    """
    return {
        'mac': device.get('mac', '').upper(),  # Normalize MAC to uppercase to avoid duplicates
        'hostname': device.get('hostname'),
        'ip': device.get('ip'),  # D-Link returns 'ip', backend expects 'ip'
        'band': device.get('band'),
        'ssid': device.get('SSID'),  # D-Link returns 'SSID' (uppercase)
        'wireless_mode': device.get('mode'),  # D-Link returns 'mode'
        'signal_strength': device.get('rssi'),  # D-Link returns 'rssi' (Received Signal Strength Indicator)
        'last_tx_rate': device.get('lastTxRate'),  # D-Link returns 'lastTxRate'
        'rx_bytes': device.get('rx_bytes', 0),
        'tx_bytes': device.get('tx_bytes', 0),
        'online_minutes': device.get('online', 0) // 60 if device.get('online') else 0,  # Convert seconds to minutes
        'power_saving': device.get('sleep', False),  # D-Link returns 'sleep'
        'connection_time': device.get('online', 0)  # Keep seconds for telemetry
    }

def push_telemetry_to_backend():
    """Background task: Fetch devices from router and push to backend"""
    global _user_id
    
    print("========== CRON JOB EXECUTING ==========", flush=True)
    logger.info("🔄 Cron: Starting telemetry push...")
    
    try:
        # Check if user is authenticated
        if not _user_id:
            logger.warning("⚠️ Cron: Not authenticated to Supabase, skipping telemetry push")
            return
        
        logger.info(f"✅ Cron: User authenticated as {_user_id}")
        
        router = get_router_client()
        
        if not router or not router.logged_in:
            logger.warning("⚠️ Cron: Router not connected, skipping telemetry push")
            return
        
        logger.info("✅ Cron: Router connected")
        
        # Get devices from router
        raw_devices = router.get_connected_devices()
        
        if not raw_devices:
            logger.info("ℹ️ Cron: No devices found")
            return
        
        logger.info(f"✅ Cron: Found {len(raw_devices)} devices")
        
        # Normalize device data to match backend schema
        devices = [normalize_device_data(d) for d in raw_devices]
        
        # Prepare telemetry payload with user_id
        payload = {
            'user_id': _user_id,
            'timestamp': time.time(),
            'devices': devices,
            'device_count': len(devices)
        }
        
        # Push to backend
        backend_url = Config.BACKEND_API_URL
        response = requests.post(
            backend_url,
            json=payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200 or response.status_code == 201:
            logger.info(f"✅ Cron: Pushed {len(devices)} devices to backend for user {Config.USER_EMAIL}")
        else:
            logger.warning(f"⚠️ Cron: Backend returned status {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Cron: Network error pushing to backend: {e}")
    except Exception as e:
        logger.error(f"❌ Cron: Error in telemetry push: {e}")

# Initialize background scheduler with daemon mode
executors = {
    'default': ThreadPoolExecutor(max_workers=1)
}
scheduler = BackgroundScheduler(executors=executors, daemon=True)
scheduler.add_job(
    func=push_telemetry_to_backend,
    trigger="interval",
    seconds=Config.POLL_INTERVAL,  # Default: 30 seconds
    id='telemetry_sync',
    name='Push telemetry to backend',
    replace_existing=True,
    misfire_grace_time=60,  # Allow 60 seconds grace period
    max_instances=1,  # Only one instance at a time
    coalesce=True  # Combine missed runs into one
)

# ============================================
# API ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'EdgeNet Agent API'})

@app.route('/status', methods=['GET'])
def status():
    """Check router connection status using persistent session"""
    try:
        router = get_router_client()
        
        if router and router.logged_in:
            return jsonify({
                'success': True,
                'connected': True,
                'message': 'Router is reachable'
            })
        else:
            return jsonify({
                'success': True,
                'connected': False,
                'message': 'Cannot connect to router'
            })
    except Exception as e:
        logger.error(f'Error checking router status: {e}')
        return jsonify({
            'success': True,
            'connected': False,
            'message': str(e)
        })

@app.route('/devices', methods=['GET'])
def get_devices_default():
    """Get connected devices using persistent session"""
    try:
        router = get_router_client()
        
        if not router or not router.logged_in:
            return jsonify({
                'success': False,
                'connected': False,
                'message': 'Router authentication failed',
                'devices': []
            }), 401

        devices = router.get_connected_devices()

        return jsonify({
            'success': True,
            'connected': True,
            'devices': devices or [],
            'count': len(devices) if devices else 0
        })

    except Exception as e:
        logger.error(f'Error getting devices: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'connected': False,
            'message': str(e),
            'devices': []
        }), 500

@app.route('/test-connection', methods=['POST'])
def test_connection():
    """Test router connection with provided credentials"""
    try:
        data = request.json
        router_ip = data.get('routerIp')
        username = data.get('username')
        password = data.get('password')

        if not all([router_ip, username, password]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: routerIp, username, password'
            }), 400

        logger.info(f'Testing connection to {router_ip}...')

        # Override config temporarily for testing
        original_url = Config.ROUTER_URL
        original_username = Config.ROUTER_USERNAME
        original_password = Config.ROUTER_PASSWORD

        Config.ROUTER_URL = f'http://{router_ip}'
        Config.ROUTER_USERNAME = username
        Config.ROUTER_PASSWORD = password

        # Test login
        router = RouterClient()
        login_success = router.login()

        # Restore original config
        Config.ROUTER_URL = original_url
        Config.ROUTER_USERNAME = original_username
        Config.ROUTER_PASSWORD = original_password

        if login_success:
            logger.info(f'✅ Successfully connected to router at {router_ip}')
            return jsonify({
                'success': True,
                'message': f'Successfully authenticated to D-Link router at {router_ip}'
            })
        else:
            logger.warning(f'❌ Failed to authenticate to {router_ip}')
            return jsonify({
                'success': False,
                'message': 'Authentication failed. Please check your credentials.'
            })

    except Exception as e:
        logger.error(f'Error testing connection: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Connection test failed: {str(e)}'
        }), 500

@app.route('/get-devices', methods=['POST'])
def get_devices():
    """Get connected devices from router"""
    try:
        data = request.json
        router_ip = data.get('routerIp')
        username = data.get('username')
        password = data.get('password')

        if not all([router_ip, username, password]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400

        # Override config
        Config.ROUTER_URL = f'http://{router_ip}'
        Config.ROUTER_USERNAME = username
        Config.ROUTER_PASSWORD = password

        router = RouterClient()
        if not router.login():
            return jsonify({
                'success': False,
                'message': 'Authentication failed'
            }), 401

        devices = router.get_connected_devices()
        router.logout()

        return jsonify({
            'success': True,
            'devices': devices,
            'count': len(devices) if devices else 0
        })

    except Exception as e:
        logger.error(f'Error getting devices: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/get-qos-settings', methods=['GET', 'POST'])
def get_qos_settings():
    """Get QoS bandwidth allocation settings"""
    try:
        router = RouterClient()
        if not router.login():
            return jsonify({
                'success': False,
                'message': 'Router authentication failed'
            }), 401

        qos_settings = router.get_qos_settings()
        router.logout()

        return jsonify({
            'success': True,
            'settings': qos_settings
        })

    except Exception as e:
        logger.error(f'Error getting QoS settings: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/set-bandwidth-limit', methods=['POST'])
def set_bandwidth_limit():
    """Set bandwidth limit for router ports (QoS)"""
    try:
        data = request.json
        port_settings = data.get('portSettings', {})
        
        if not port_settings:
            return jsonify({
                'success': False,
                'message': 'Missing portSettings in request body'
            }), 400

        logger.info(f'Setting bandwidth limits for ports: {list(port_settings.keys())}')

        router = RouterClient()
        if not router.login():
            return jsonify({
                'success': False,
                'message': 'Router authentication failed'
            }), 401

        result = router.set_bandwidth_limit(port_settings)
        router.logout()

        if result and result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result or {
                'success': False,
                'message': 'Failed to set bandwidth limit'
            }), 500

    except Exception as e:
        logger.error(f'Error setting bandwidth limit: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/get-bandwidth-usage', methods=['POST'])
def get_bandwidth_usage():
    """Get bandwidth usage statistics for device(s)"""
    try:
        data = request.json
        mac = data.get('mac')  # Optional: filter by MAC

        router = RouterClient()
        if not router.login():
            return jsonify({
                'success': False,
                'message': 'Router authentication failed'
            }), 401

        bandwidth_stats = router.get_bandwidth_usage(mac)
        router.logout()

        return jsonify({
            'success': True,
            'stats': bandwidth_stats
        })

    except Exception as e:
        logger.error(f'Error getting bandwidth usage: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/save-config', methods=['POST'])
def save_config():
    """Save router configuration persistently"""
    try:
        data = request.json
        router_ip = data.get('routerIp')
        username = data.get('username')
        password = data.get('password')

        if not all([router_ip, username, password]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: routerIp, username, password'
            }), 400

        # Test connection first
        original_url = Config.ROUTER_URL
        original_username = Config.ROUTER_USERNAME
        original_password = Config.ROUTER_PASSWORD

        Config.ROUTER_URL = f'http://{router_ip}'
        Config.ROUTER_USERNAME = username
        Config.ROUTER_PASSWORD = password

        router = RouterClient()
        login_success = router.login()

        if not login_success:
            # Restore original config if test fails
            Config.ROUTER_URL = original_url
            Config.ROUTER_USERNAME = original_username
            Config.ROUTER_PASSWORD = original_password
            
            return jsonify({
                'success': False,
                'message': 'Authentication failed. Config not saved.'
            }), 401

        router.logout()

        # Save to file
        config_data = {
            'routerIp': router_ip,
            'username': username,
            'password': password,
            'pollingInterval': data.get('pollingInterval', 30)
        }
        
        if save_config_to_file(config_data):
            logger.info(f'✅ Router configuration saved and activated for {router_ip}')
            return jsonify({
                'success': True,
                'message': 'Router configuration saved successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to save configuration file'
            }), 500

    except Exception as e:
        logger.error(f'Error saving config: {e}', exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/config-exists', methods=['GET'])
def check_config_exists():
    """Check if router configuration file exists"""
    try:
        has_config = os.path.exists(CONFIG_FILE_PATH)
        config_data = None
        
        if has_config:
            with open(CONFIG_FILE_PATH, 'r') as f:
                config_data = json.load(f)
                # Don't send password to frontend
                config_data.pop('password', None)
        
        return jsonify({
            'success': True,
            'exists': has_config,
            'config': config_data
        })
    except Exception as e:
        logger.error(f'Error checking config: {e}')
        return jsonify({
            'success': False,
            'exists': False,
            'message': str(e)
        })

if __name__ == '__main__':
    logger.info('=' * 50)
    logger.info('Starting EdgeNet Agent API...')
    logger.info(f'Backend API: {Config.BACKEND_API_URL}')
    logger.info(f'Sync Interval: {Config.POLL_INTERVAL} seconds')
    logger.info('=' * 50)
    
    # Start background scheduler
    scheduler.start()
    logger.info('✅ Background telemetry sync started')
    
    # Test: Run the job once immediately on startup
    logger.info('🧪 Testing cron job - running once immediately...')
    push_telemetry_to_backend()
    
    try:
        # Run Flask app
        app.run(host='0.0.0.0', port=5000, debug=False)
    except (KeyboardInterrupt, SystemExit):
        # Shutdown scheduler on exit
        scheduler.shutdown()
        logger.info('🛑 Agent stopped')
