FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build the application
RUN npx tsc

# Expose port for WebSocket
EXPOSE 8080

# Start the service
CMD ["node", "dist/index.js"]
