FROM node:22.23.4

WORKDIR /avalanche-faucet

COPY . .

RUN npm install

RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
