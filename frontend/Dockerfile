# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY . .
RUN npm ci

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]