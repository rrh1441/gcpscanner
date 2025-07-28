FROM node:18-slim

# Install system dependencies for security tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    dnsutils \
    nmap \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy source code and modules
COPY . .

# Install security tools (nuclei, etc.)
RUN curl -L https://github.com/projectdiscovery/nuclei/releases/download/v3.0.4/nuclei_3.0.4_linux_amd64.zip -o nuclei.zip \
    && unzip nuclei.zip \
    && mv nuclei /usr/local/bin/ \
    && rm nuclei.zip \
    && chmod +x /usr/local/bin/nuclei

# Update nuclei templates
RUN nuclei -update-templates

# Create non-root user
RUN groupadd -r scanuser && useradd -r -g scanuser scanuser
RUN chown -R scanuser:scanuser /app
USER scanuser

# Set resource limits for Cloud Run Jobs
ENV NODE_OPTIONS="--max-old-space-size=1024"

CMD ["npm", "start"]