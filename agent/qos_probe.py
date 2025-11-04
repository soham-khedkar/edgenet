#!/usr/bin/env python3
"""
QoS Probe Script - Find QoS/Bandwidth Control API endpoints for D-Link DIR-615
"""

from router_client import RouterClient
import logging
import json

logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def probe_qos_endpoints():
    """Probe router for QoS-related API endpoints"""
    
    router = RouterClient()
    if not router.login():
        logger.error("Failed to login to router")
        return
    
    logger.info("=== Probing for QoS/Bandwidth Control Endpoints ===")
    
    # Common QoS-related table IDs to try
    potential_qos_ids = [
        50,  # Generic QoS table
        51,  # QoS rules
        52,  # Bandwidth control
        60,  # WAN settings
        61,  # WAN bandwidth
        70,  # Traffic control
        100, # Advanced settings
        150, # Bandwidth management
    ]
    
    results = {}
    
    for table_id in potential_qos_ids:
        try:
            logger.info(f"\n--- Testing Table ID: {table_id} ---")
            
            payload = {
                "id": 1000 + table_id,
                "jsonrpc": "2.0",
                "method": "read",
                "params": {
                    "id": table_id
                }
            }
            
            response = router._jsonrpc_call("read", payload["params"], request_id=payload["id"])
            
            if response and response.get('success'):
                result_data = response.get('result', {})
                logger.info(f"✅ SUCCESS - Table {table_id}")
                logger.info(f"Data: {json.dumps(result_data, indent=2)}")
                results[table_id] = result_data
            else:
                logger.debug(f"❌ No data for table {table_id}")
                
        except Exception as e:
            logger.debug(f"❌ Error reading table {table_id}: {e}")
    
    # Try to read WAN configuration
    logger.info("\n=== Attempting to read WAN configuration ===")
    try:
        wan_payload = {
            "id": 2000,
            "jsonrpc": "2.0",
            "method": "read",
            "params": {
                "id": 40  # Common WAN settings ID
            }
        }
        wan_response = router._jsonrpc_call("read", wan_payload["params"], request_id=wan_payload["id"])
        if wan_response and wan_response.get('success'):
            logger.info(f"✅ WAN Config: {json.dumps(wan_response.get('result'), indent=2)}")
            results['wan_config'] = wan_response.get('result')
    except Exception as e:
        logger.debug(f"Could not read WAN config: {e}")
    
    router.logout()
    
    # Summary
    logger.info("\n=== SUMMARY ===")
    logger.info(f"Found {len(results)} valid QoS/Bandwidth endpoints:")
    for table_id, data in results.items():
        logger.info(f"  - Table ID {table_id}: {list(data.keys()) if isinstance(data, dict) else 'Array'}")
    
    # Save results to file
    with open('qos_probe_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    logger.info("\n✅ Results saved to qos_probe_results.json")
    
    return results

if __name__ == '__main__':
    print("🔍 D-Link DIR-615 QoS Endpoint Probe")
    print("=" * 50)
    probe_qos_endpoints()
