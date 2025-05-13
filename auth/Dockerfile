FROM node:18-alpine

WORKDIR /app

# # Install build dependencies for bcrypt and other native modules
RUN apk add --no-cache python3 make g++
RUN mkdir -p /app/public/images 

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies 
RUN pnpm install

# Copy application code
COPY . .

# Build TypeScript code
RUN pnpm run build

# Rebuild bcrypt specifically to ensure it's properly compiled
RUN cd node_modules/bcrypt && npm rebuild bcrypt --build-from-source

# Generate self-signed certificates so they are available at runtime
RUN apk add --no-cache openssl && \
    mkdir -p /certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /certs/selfsigned.key \
    -out /certs/selfsigned.crt \
    -subj "/CN=localhost" && \
    apk del openssl

# Set environment to production
ENV NODE_ENV=production

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["pnpm", "start"]