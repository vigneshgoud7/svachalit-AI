FROM node:18-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for production build
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Compile production Next.js build
RUN npm run build

# Expose Next.js dashboard port
EXPOSE 3000

# Start production dashboard server
CMD ["npm", "start"]
