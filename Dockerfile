FROM node:20-slim AS builder

WORKDIR /avalanche-faucet

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

WORKDIR /avalanche-faucet

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /avalanche-faucet/dist ./dist

EXPOSE 8000

USER node

CMD ["npm", "start"]
