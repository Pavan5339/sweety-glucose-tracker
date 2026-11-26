FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

# Runs migration, seed if empty, and starts the server
CMD ["sh", "-c", "node scripts/migrate.js && node scripts/seed.js && npm start"]
