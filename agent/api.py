#!/usr/bin/env python3
"""
EdgeNet Agent API - Flask server for router operations
Provides endpoints for the backend to test router connections
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
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

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'EdgeNet Agent API'})

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

if __name__ == '__main__':
    logger.info('Starting EdgeNet Agent API...')
    logger.info('Running on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=False)
