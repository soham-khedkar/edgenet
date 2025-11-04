# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Copy source code
COPY . .

# Install dependencies AND build in one layer (avoids pnpm virtual store issues)
RUN CI=true pnpm install && pnpm build

# Remove dev dependencies after build
RUN pnpm prune --prod

# Expose frontend port
EXPOSE 3000

# Start Next.js production server
CMD ["pnpm", "start"]
