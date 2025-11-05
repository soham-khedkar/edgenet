#!/usr/bin/env python3
"""
EdgeNet Multi-Tenant Agent - Monitors ALL users' routers
Fetches all router configs from Supabase and polls each router
"""

from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import os
import requests
from router_client import RouterClient
from config import Config
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Supabase client with service role key (bypasses RLS to access all users)
supabase_admin: Client = create_client(
    Config.SUPABASE_URL,
    Config.SUPABASE_SERVICE_ROLE_KEY
)

def normalize_device_data(device):
    """Normalize router device data to match backend schema"""
    return {
        'mac': device.get('mac', '').upper(),
        'hostname': device.get('hostname'),
        'ip': device.get('ip'),
        'band': device.get('band'),
        'ssid': device.get('SSID'),
        'wireless_mode': device.get('mode'),
        'signal_strength': device.get('rssi'),
        'last_tx_rate': device.get('lastTxRate'),
        'rx_bytes': device.get('rx_bytes', 0),
        'tx_bytes': device.get('tx_bytes', 0),
        'online_minutes': device.get('online', 0) // 60 if device.get('online') else 0,
        'power_saving': device.get('sleep', False),
        'connection_time': device.get('online', 0)
    }

def fetch_all_router_configs():
    """Fetch all users' router configurations from Supabase"""
    try:
        logger.info("🔍 Fetching all router configurations from Supabase...")
        
        response = supabase_admin.table('user_router_configs') \
            .select('*') \
            .execute()
        
        if response.data:
            logger.info(f"✅ Found {len(response.data)} router configurations")
            return response.data
        else:
            logger.warning("⚠️ No router configurations found in database")
            return []
            
    except Exception as e:
        logger.error(f"❌ Error fetching router configs: {e}")
        return []

def poll_single_router(router_config):
    """Poll a single user's router and push telemetry"""
    user_id = router_config.get('user_id')
    router_ip = router_config.get('router_ip')
    username = router_config.get('username')
    password = router_config.get('password')
    
    logger.info(f"📡 Polling router {router_ip} for user {user_id[:8]}...")
    
    try:
        # Create router client with this user's credentials
        router = RouterClient(router_ip=router_ip, username=username, password=password)
        
        # Login to router
        if not router.login():
            logger.warning(f"⚠️ Failed to login to router {router_ip}")
            return
        
        # Get connected devices
        raw_devices = router.get_connected_devices()
        
        if not raw_devices:
            logger.info(f"ℹ️ No devices found on router {router_ip}")
            router.logout()
            return
        
        # Normalize device data
        devices = [normalize_device_data(d) for d in raw_devices]
        
        # Push to backend
        payload = {
            'devices': devices,
            'user_id': user_id  # Tag data with correct user_id
        }
        
        response = requests.post(
            Config.BACKEND_API_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"✅ Pushed {len(devices)} devices from router {router_ip}")
        else:
            logger.error(f"❌ Backend returned {response.status_code} for router {router_ip}")
        
        # Logout
        router.logout()
        
    except Exception as e:
        logger.error(f"❌ Error polling router {router_ip}: {e}")

def poll_all_routers():
    """Background task: Poll ALL users' routers"""
    logger.info("========== MULTI-TENANT CRON JOB ==========")
    
    # Fetch all router configs
    router_configs = fetch_all_router_configs()
    
    if not router_configs:
        logger.warning("⚠️ No routers to poll")
        return
    
    # Poll each router
    for config in router_configs:
        poll_single_router(config)
    
    logger.info(f"✅ Completed polling {len(router_configs)} routers")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render"""
    return jsonify({'status': 'ok', 'message': 'Multi-tenant agent running'}), 200

# Start background scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=poll_all_routers,
    trigger='interval',
    seconds=Config.POLL_INTERVAL,
    id='poll_all_routers',
    name='Poll all users routers',
    replace_existing=True
)
scheduler.start()

# Run initial poll on startup
logger.info("🚀 Starting multi-tenant agent...")
logger.info(f"📊 Poll interval: {Config.POLL_INTERVAL} seconds")
poll_all_routers()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
