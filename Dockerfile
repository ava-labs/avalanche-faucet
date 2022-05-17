FROM node:latest

WORKDIR /avalanche-faucet

COPY ./package.json .
COPY ./client .

RUN npm install

RUN npm run build

COPY ./ .

EXPOSE 8000

CMD ["npm", "start"]