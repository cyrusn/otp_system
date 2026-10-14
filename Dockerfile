FROM node:22-alpine

# Install build dependencies for better-sqlite3 native compilation on alpine
RUN apk add --no-cache build-base gcompat python3

WORKDIR /app

# Copy package.json and packages
COPY package*.json ./
COPY jsconfig.json ./

# Install dependencies including native C++ module compilation
RUN npm install

# Create data directory for SQLite persistence (to be mapped to a Docker volume)
RUN mkdir -p /app/data

# Copy the rest of the application code
COPY app ./app
COPY public ./public
COPY lib ./lib
COPY next.config.mjs ./
COPY instrumentation.js ./

# Copy production env for Next.js build stage
COPY .env.production ./

# The production image is served under /otp by the reverse proxy.
ENV BASE_PATH=/otp

# Build the Next.js application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
