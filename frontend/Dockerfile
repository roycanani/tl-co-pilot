# Stage 1: Build the application
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
# --frozen-lockfile ensures that pnpm doesn't generate a new lockfile and fails if an update is needed.
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Update next.config.ts to enable standalone output
RUN sed -i 's/output: .*/output: "standalone",/g' next.config.ts || echo 'output: "standalone",' >> next.config.ts

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_BASE_URL  
ARG REACT_APP_STORAGE_URL

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_STORAGE_URL=$REACT_APP_STORAGE_URL

RUN pnpm build

# Stage 2: Run the Next.js application
FROM node:18-alpine

WORKDIR /app

# Create necessary directories
RUN mkdir -p public/assets

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the listening port
EXPOSE 3000

ENV NODE_ENV=production

# Run the Next.js application
CMD ["node", "server.js"]