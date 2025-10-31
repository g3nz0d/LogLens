FROM node:18-alpine

# Install system dependencies for node-gyp and build tools
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Clean npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --production=false --verbose

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (though not needed for Slack Socket Mode)
EXPOSE 3000

# No health check needed for Slack Socket Mode app

# Start the application
CMD ["npm", "start"]
