#!/usr/bin/env python3
"""
EdgeNet Agent - D-Link DIR-615 Network Monitor
Scrapes router device data via JSON-RPC and sends to backend API
"""

import time
import logging
import sys
from datetime import datetime
from router_client import RouterClient
from data_parser import DataParser
from api_client import BackendClient
from config import Config

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class EdgeNetAgent:
    """Main agent orchestrator"""
    
    def __init__(self):
        self.router = RouterClient()
        self.parser = DataParser()
        self.backend = BackendClient()
        self.running = False
    
    def start(self):
        """Start the agent monitoring loop"""
        logger.info('=' * 50)
        logger.info('🚀 EdgeNet Agent Starting')
        logger.info('=' * 50)
        logger.info(f'Router: {Config.ROUTER_URL}')
        logger.info(f'Backend: {Config.BACKEND_API_URL}')
        logger.info(f'Poll Interval: {Config.POLL_INTERVAL}s')
        logger.info('=' * 50)
        
        # Test backend connection first
        logger.info('Testing backend connection...')
        if not self.backend.test_connection():
            logger.error('⚠️  Backend is not reachable! Check if backend is running.')
            logger.error(f'   Expected at: {Config.BACKEND_API_URL}')
            logger.error('   Continuing anyway, will retry on each poll...')
        
        # Login to router
        logger.info('Logging into router...')
        if not self.router.login():
            logger.error('❌ Failed to login to router. Check credentials in .env')
            sys.exit(1)
        
        # Start monitoring loop
        self.running = True
        logger.info('✅ Agent started successfully')
        logger.info('Monitoring router... (Press Ctrl+C to stop)')
        
        try:
            self.run_loop()
        except KeyboardInterrupt:
            logger.info('\n⏹️  Stopping agent...')
            self.stop()
        except Exception as e:
            logger.error(f'💥 Fatal error: {e}', exc_info=True)
            self.stop()
            sys.exit(1)
    
    def run_loop(self):
        """Main monitoring loop - polls router and sends data"""
        iteration = 0
        
        while self.running:
            iteration += 1
            logger.info(f'\n📡 Scan #{iteration} - {datetime.now().strftime("%H:%M:%S")}')
            
            try:
                # Step 1: Fetch devices from router
                logger.info('Fetching connected devices from router...')
                raw_devices = self.router.get_connected_devices()
                
                if raw_devices is None:
                    logger.warning('Failed to fetch devices, will retry next cycle')
                    time.sleep(Config.POLL_INTERVAL)
                    continue
                
                if len(raw_devices) == 0:
                    logger.info('No devices currently connected')
                    time.sleep(Config.POLL_INTERVAL)
                    continue
                
                # Step 2: Parse device data
                logger.info(f'Parsing {len(raw_devices)} devices...')
                parsed_devices = self.parser.parse_devices(raw_devices)
                
                if not parsed_devices:
                    logger.warning('No valid devices after parsing')
                    time.sleep(Config.POLL_INTERVAL)
                    continue
                
                # Step 3: Send to backend
                logger.info(f'Sending {len(parsed_devices)} devices to backend...')
                success = self.backend.send_telemetry(parsed_devices)
                
                if success:
                    logger.info(f'✅ Scan #{iteration} completed successfully')
                else:
                    logger.warning(f'⚠️  Scan #{iteration} had errors sending to backend')
                
            except Exception as e:
                logger.error(f'Error in scan #{iteration}: {e}', exc_info=True)
            
            # Wait before next poll
            logger.info(f'Waiting {Config.POLL_INTERVAL}s until next scan...')
            time.sleep(Config.POLL_INTERVAL)
    
    def stop(self):
        """Stop the agent gracefully"""
        self.running = False
        self.router.logout()
        logger.info('Agent stopped')

def main():
    """Entry point"""
    try:
        agent = EdgeNetAgent()
        agent.start()
    except Exception as e:
        logger.error(f'Failed to start agent: {e}', exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
