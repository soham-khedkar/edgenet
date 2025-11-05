// Supabase database client with Row Level Security
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables exist
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
}

// Database type definitions for type safety
export interface Device {
    id?: string;
    hostname: string | null;
    mac: string;
    ssid: string | null;
    ipv4: string | null;
    signal_level: number | null;
    band: string | null;
    wireless_mode: string | null;
    online_minutes: number | null;
    last_tx_rate: string | null;
    rx_bytes: string | null;
    tx_bytes: string | null;
    power_saving: boolean | null;
    last_seen?: string;
    first_seen?: string;
}

export interface Telemetry {
    id?: string;
    payload: Record<string, any>;
    created_at?: string;
}

// Database schema type definition
export interface Database {
    public: {
        Tables: {
            devices: {
                Row: Device;
                Insert: Omit<Device, 'id' | 'first_seen' | 'last_seen'>;
                Update: Partial<Omit<Device, 'id' | 'first_seen'>>;
            };
            telemetry: {
                Row: Telemetry;
                Insert: Omit<Telemetry, 'id' | 'created_at'>;
                Update: Partial<Omit<Telemetry, 'id' | 'created_at'>>;
            };
        };
    };
}

// Create Supabase client with anon key (uses RLS policies)
// This is used for frontend-facing endpoints that require user authentication
const supabase: SupabaseClient<Database> = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Create admin client with service role key (bypasses RLS)
// This is used for server-side operations like telemetry ingestion
const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Test database connection on startup
async function testConnection(): Promise<void> {
    try {
        const { error } = await supabase
            .from('devices')
            .select('count');
        
        if (error) {
            console.error('✗ Supabase connection failed:', error.message);
            console.error('  Make sure you have run the database_setup.sql in Supabase SQL Editor!');
            return;
        }
        console.log('✓ Connected to Supabase database');
    } catch (error) {
        console.error('✗ Supabase connection failed:', (error as Error).message);
        console.error('  Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
    }
}

// Export client and utilities
export { supabase, supabaseAdmin, testConnection };
