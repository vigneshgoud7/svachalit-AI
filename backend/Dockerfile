FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code and prisma schema
COPY . .

# Generate Prisma Client and build TypeScript source
RUN npx prisma generate
RUN npm run build

# Expose API port
EXPOSE 4000

# Push database migrations and run production server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
