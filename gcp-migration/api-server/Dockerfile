FROM node:18-slim

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY server.ts ./

# Install tsx for TypeScript execution
RUN npm install tsx@4

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

CMD ["npm", "start"]