# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

# Accept build args for Supabase
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set as environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies first
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build with environment variables
RUN pnpm build

# Expose frontend port
EXPOSE 3000

# Start Next.js production server
CMD ["pnpm", "start"]
