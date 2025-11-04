# EdgeNet

Network monitoring and management system for D-Link routers with real-time analytics and bandwidth control.

## Features

- 📊 Real-time network monitoring dashboard
- 🔧 QoS bandwidth control for WAN/LAN ports
- 📈 Network statistics and usage analytics
- 🖥️ Device management and tracking
- 🐳 Docker containerized deployment

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Agent**: Python, Flask
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Docker & Docker Compose

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/soham-khedkar/edgenet.git
   cd edgenet
   ```

2. **Set up environment variables**
   ```bash
   # Copy example env files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Edit .env files with your configuration
   ```

3. **Run with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Agent API: http://localhost:5000

## Project Structure

```
edgenet/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js backend API
├── agent/             # Python router communication agent
└── docker-compose.yml # Container orchestration
```

## Environment Setup

See `.env.example` files in each directory for required configuration variables.

## Development

Each service can be run independently:

```bash
# Frontend (port 3000)
cd frontend
pnpm install
pnpm dev

# Backend (port 4000)
cd backend
pnpm install
pnpm dev

# Agent (port 5000)
cd agent
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python api.py
```

## License

MIT
