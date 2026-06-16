FROM node:20-alpine

WORKDIR /app

# Copy package lock and json
COPY package*.json ./

# Install dependencies (including devDependencies so tsx and typescript are available to run index.ts)
RUN npm install

# Copy source code (respecting .dockerignore)
COPY . .

# Create uploads/evaluaciones directory so it exists
RUN mkdir -p uploads/evaluaciones

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx tsx src/run_all_migrations.ts && npx tsx src/index.ts"]
