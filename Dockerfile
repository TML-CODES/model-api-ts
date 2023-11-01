FROM node:16.20-alpine AS dependencies
RUN npm install -g npm@9.6.4 
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM node:16.20-alpine AS builder

# Create app directory
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules

RUN npm run build

RUN npx prisma generate

FROM node:16.20-alpine

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD [ "npm", "run","start" ]
