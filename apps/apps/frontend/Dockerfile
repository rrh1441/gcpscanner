FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 8080

# Run the app
CMD ["npm", "start"]