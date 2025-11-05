# EdgeNet

Real-time network monitoring and bandwidth management system for D-Link routers with secure multi-user authentication.

## 📖 About

EdgeNet is a full-stack web application that enables users to monitor their home network devices in real-time and control bandwidth allocation. The system provides:

- **Real-time device monitoring** - See all connected devices with live bandwidth usage
- **QoS bandwidth control** - Set upload/download limits per device
- **Historical analytics** - Track network usage patterns over time
- **Multi-user authentication** - Each user manages their own router
- **Secure local agent** - Router credentials never leave your network

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Components                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Frontend  │  │  Backend   │  │  Supabase Database   │  │
│  │  Next.js   │──│  Node.js   │──│  PostgreSQL + Auth   │  │
│  │            │  │  Express   │  │                      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                         HTTPS
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Local Network (User)                     │
│  ┌────────────┐         ┌──────────────────────────┐        │
│  │   Agent    │────────▶│      D-Link Router       │        │
│  │   Python   │  HTTP   │   (192.168.x.x)          │        │
│  │   Flask    │         │                          │        │
│  └────────────┘         └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**
1. Agent (running locally) polls router for device data
2. Agent sends telemetry to cloud backend via REST API
3. Backend stores data in Supabase with user authentication
4. Frontend displays real-time dashboard with live updates
5. User actions (bandwidth limits) flow back through the chain

## 🚀 Local Setup

### Prerequisites
- Docker & Docker Compose installed
- Supabase account (free tier works)
- D-Link router with admin access

### Step 1: Clone Repository
```bash
git clone https://github.com/soham-khedkar/edgenet.git
cd edgenet
```

### Step 2: Configure Environment Variables

Create `.env` files for each component:

**`frontend/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**`backend/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
PORT=4000
```

**`agent/.env`**
```env
ROUTER_IP=192.168.1.1
ROUTER_USERNAME=admin
ROUTER_PASSWORD=your_password
BACKEND_API_URL=http://backend:4000/api/telemetry
```

### Step 3: Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL Editor:

```sql
-- Create devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  mac_address TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create telemetry table
CREATE TABLE telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  device_id UUID REFERENCES devices(id),
  bandwidth_up INTEGER,
  bandwidth_down INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own devices" ON devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own telemetry" ON telemetry
  FOR SELECT USING (auth.uid() = user_id);
```

### Step 4: Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Agent API**: http://localhost:5000

Create an account via the frontend, configure your router details in setup, and start monitoring!


## � Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Node.js, Express, TypeScript
- **Agent**: Python 3.11, Flask
- **Database**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Docker & Docker Compose

## �📁 Project Structure

```
edgenet/
├── frontend/              # Next.js web interface
│   ├── src/app/          # Pages & routing
│   ├── src/components/   # UI components & charts
│   └── src/hooks/        # Real-time data hooks
│
├── backend/              # Express API server
│   ├── src/controllers/  # API endpoints
│   ├── src/services/     # Supabase integration
│   └── src/middleware/   # CORS & error handling
│
├── agent/                # Python Flask agent
│   ├── api.py           # Main API server
│   └── router_client.py # Router communication
│
└── docker-compose.yml    # Orchestration config
```

## 📄 License

MIT © [Soham Khedkar](https://github.com/soham-khedkar)
