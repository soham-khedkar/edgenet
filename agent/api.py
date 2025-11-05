#!/usr/bin/env python3
"""
EdgeNet Agent API - Flask server for router operations
Provides endpoints for the backend to test router connections
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
import time
from router_client import RouterClient
from config import Config

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes with wildcard

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

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
    logger.info('Starting EdgeNet Agent API...')
    logger.info('Running on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=False)
