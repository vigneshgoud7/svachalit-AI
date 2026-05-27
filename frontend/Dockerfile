FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for production build
ENV NODE_ENV=production

# Compile production Next.js build
RUN npm run build

# Expose Next.js dashboard port
EXPOSE 3000

# Start production dashboard server
CMD ["npm", "start"]
