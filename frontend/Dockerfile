# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Set VITE_API_URL during build time if needed, but defaults to /api or localhost:3000
# We can set it to relative '/api' or empty so it uses current domain's Nginx proxy
ENV VITE_API_URL=""

RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
