FROM node:18-slim

# Install system dependencies and security tools
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    python3 \
    python3-pip \
    nmap \
    dnsutils \
    whois \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install sslscan
RUN apt-get update && apt-get install -y sslscan && rm -rf /var/lib/apt/lists/*

# Install nuclei
RUN wget https://github.com/projectdiscovery/nuclei/releases/download/v3.0.1/nuclei_3.0.1_linux_amd64.zip \
    && unzip nuclei_3.0.1_linux_amd64.zip \
    && mv nuclei /usr/local/bin/ \
    && rm nuclei_3.0.1_linux_amd64.zip

# Install trufflehog
RUN wget https://github.com/trufflesecurity/trufflehog/releases/download/v3.63.0/trufflehog_3.63.0_linux_amd64.tar.gz \
    && tar -xzf trufflehog_3.63.0_linux_amd64.tar.gz \
    && mv trufflehog /usr/local/bin/ \
    && rm trufflehog_3.63.0_linux_amd64.tar.gz

# Install Python dependencies
RUN pip3 install --break-system-packages --no-cache-dir dnspython requests beautifulsoup4

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create non-root user
RUN useradd -m -u 1001 scanner && chown -R scanner:scanner /app

# Switch to non-root user
USER scanner

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the worker
CMD ["node", "dist/worker-pubsub.js"]