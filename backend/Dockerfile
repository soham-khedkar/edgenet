# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Copy source code first (so install and build happen together)
COPY . .

# Install dependencies AND build in one layer to avoid pnpm virtual store issues
# Set CI=true to avoid TTY prompts in Docker
RUN CI=true pnpm install --no-frozen-lockfile && pnpm run build

# Remove dev dependencies after build to reduce image size
RUN pnpm prune --prod

# Expose backend port
EXPOSE 4000

# Start server
CMD ["node", "dist/server.js"]
