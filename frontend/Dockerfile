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

# Build the application for production
# Replace 'build' with your actual build script name in package.json if different
RUN pnpm build

# Stage 2: Run the Next.js application
FROM node:18-alpine

WORKDIR /app

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the listening port
EXPOSE 3000

ENV NODE_ENV=production

# Run the Next.js application
CMD ["node", "server.js"]