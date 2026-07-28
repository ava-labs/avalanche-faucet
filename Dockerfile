FROM node:20-slim AS builder

WORKDIR /avalanche-faucet

COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

WORKDIR /avalanche-faucet

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /avalanche-faucet/build ./build

EXPOSE 8000

USER node

CMD ["npm", "start"]
