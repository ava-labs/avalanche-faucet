# Faucet Server and Client

This repository has both server and client that are required to host a faucet for your EVM subnet. We have used the ReactJS client for interacting with the Node.js Faucet Server.

## Requirements

* [Node](https://nodejs.org/en) >= 17.0 and [npm](https://www.npmjs.com/) >= 8.0
* [Google's ReCaptcha](https://www.google.com/recaptcha/intro/v3.html) v3 keys
* [Docker](https://www.docker.com/get-started/)

## Installation

Clone this repository at your preferred location.

```bash
git clone https://github.com/ava-labs/faucet
```

## Client Side Configurations

We need to configure our application with the server API endpoints and Captcha site keys. All the client-side configurations are there in the `src/config.json` file. Since there are no secrets on the client-side, we do not need any environment variables. Update the config files according to your need.

```json
{
    "banner": "/banner.png",
    "apiBaseEndpointProduction": "/api/",
    "apiBaseEndpointDevelopment": "http://localhost:8000/api/",
    "apiTimeout": 10000,
    "CAPTCHA": {
        "siteKey": "6LcNScYfAAAAAJH8fauA-okTZrmAxYqfF9gOmujf",
        "action": "faucetdrip"
    }
}
```

Put the Google's ReCaptcha site-key without which the faucet client can't send the necessary captcha response to the server. This key is not a secret and could be public.

In the above file, there are 2 base endpoints for the faucet server `apiBaseEndpointProduction` and `apiBaseEndpointDevelopment`. Since in production mode, the client-side will be served as static content, it will be served over the server's endpoint, and hence we do not have to provide the server's IP address or domain. It should be a valid URL where the server's APIs are hosted. If the endpoints for API have a leading `/v1/api` and the server is running on localhost at port 3000, then you should use `http://localhost:3000/v1/api` or `/v1/api/` depending on whether it is production or development.

## Server-Side Configuration

On the server-side, we need to configure 2 files - `server/.env` for secret keys and `server/config.json` for chain and API's rate limiting configurations.

### Setup Environment Variables

Setup the environment variable with your private key and ReCaptcha secret. Make a `.env` file in your preferred location with the following credentials, as this fill will not be committed to the repository. The faucet server can handle multiple EVM chains, and therefore requires private keys for addresses with funds on each of the chains.

If you have funds on the same address on every chain, then you can just use the `PK` variable. But if you have funds on different addresses on different chains, then you can provide each of the private keys against their chain name, as shown below.

```env
C="C chain private key"
WAGMI="Wagmi chain private key"
PK="Sender Private Key with Funds in it"
CAPTCHA_SECRET="Google ReCaptcha Secret"
```
### Setup EVM Chain Configurations

You can create a faucet server for any EVM chain by making changes in the `config.json` file. Add your chain configuration as shown below in the `evmchains` object. Configuration for Fuji's C-Chain and WAGMI chain is shown below for example.

```json
"evmchains": [
    {
        "ID": "C",
        "NAME": "Avalanche C Chain",
        "TOKEN": "AVAX",
        "RPC": "https://api.avax-test.network/ext/C/rpc",
        "CHAINID": 43113,
        "EXPLORER": "https://testnet.snowtrace.io/",
        "IMAGE": "https://notify.avax.network/favicon.svg",
        "MAX_PRIORITY_FEE": "2000000000",
        "MAX_FEE": "100000000000",
        "DRIP_AMOUNT": 10000000000,
        "RECALIBRATE": 30,
        "RATELIMIT": {
            "MAX_LIMIT": 1,
            "WINDOW_SIZE": 60
        }
    },
    {
        "ID": "WAGMI",
        "NAME": "WAGMI Chain",
        "TOKEN": "WGM",
        "RPC": "https://subnets.avax.network/wagmi/wagmi-chain-testnet/rpc",
        "CHAINID": 11111,
        "EXPLORER": "https://subnets.avax.network/wagmi/wagmi-chain-testnet/explorer/",
        "IMAGE": "https://raw.githubusercontent.com/ava-labs/subnet-evm/master/imgs/wagmi.png",
        "MAX_PRIORITY_FEE": "2000000000",
        "MAX_FEE": "100000000000",
        "DRIP_AMOUNT": 10000000,
        "RATELIMIT": {
            "MAX_LIMIT": 2,
            "WINDOW_SIZE": 60
        }
    }
]
```
In the above configuration drip amount is in `nAVAX` or `gwei`, whereas fees are in `wei`. For example, with the above configurations, the faucet will send `1 AVAX` with maximum fees per gas being `100 nAVAX` and priority fee as `2 nAVAX`.

The rate limiter for C Chain will only accept 1 request in 60 minutes for a particular API and 2 requests in 60 minutes for the WAGMI chain. Though it will skip any failed requests so that users can request tokens again, even if there is some internal error in the application. On the other hand, the global rate limiter will allow 15 requests per minute on every API. This time failed requests will also get counted so that no one can abuse the APIs.

## Setting up with Docker

Follow the steps to run this application in a Docker container.

### Build Docker Image

Docker images can be served as the built versions of our application, that can be used to deploy on Docker container.

```bash
docker build . -t faucet-image
```

### Starting Application inside Docker Container

Now we can create any number of containers using the above `faucet` image. We also have to supply the `.env` file or the environment variables with the secret keys to create the container. Once the container is created, these variables and configurations will be persisted and can be easily started or stopped with a single command.

```bash
docker run -p 3000:8000 --name faucet-container --env-file ../.env faucet-image
```

The server will run on port 8000, and our Docker will also expose this port for the outer world to interact. We have exposed this port in the `Dockerfile`. But we cannot directly interact with the container port, so we had to bind this container port to our host port. For the host port, we have chosen 3000. This flag `-p 3000:8000` achieves the same.

This will start our faucet application in a Docker container at port 3000 (port 8000 on the container). You can interact with the application by visiting http://localhost:3000 in your browser.

### Stopping the Container

You can easily stop the container using the following command

```bash
docker stop faucet-container
```

### Restarting the Container

To restart the container, use the following command

```bash
docker start faucet-container
```

## API Endpoints

This server will expose the following APIs

### Health API

The `/health` API will always return a response with a `200` status code. This endpoint can be used to know the health of the server.

```bash
curl http://localhost:8000/health
```

Response

```bash
Server healthy
```

### Get Drop Size

This API will be used for fetching the drop amount that the faucet server is providing per request.

```bash
curl http://localhost:8000/api/getDripAmount
```

It will give the following response

```bash
{
    "dripAmount": 10
}
```

### Send Token

This API endpoint will handle token requests from users. It will return the transaction hash as a receipt of the faucet drip.

```bash
curl -d '{
        "address": "0x3EA53fA26b41885cB9149B62f0b7c0BAf76C78D4"
        "chain": "C"
}' -H 'Content-Type: application/json' http://localhost:8000/api/sendToken
```

Send token API requires a Captcha response token that is generated using the Captcha site key on the client-side. Since we can't generate and pass this token while making a curl request, we have to disable the captcha verification for testing purposes. You can find the steps to disable it in the next sections. The response is shown below

```bash
{
    "message": "Transaction successful on Avalanche C Chain!",
    "txHash": "0x3d1f1c3facf59c5cd7d6937b3b727d047a1e664f52834daf20b0555e89fc8317"
}
```

## Rate Limiters

The rate limiters are applied on the global (all endpoints) as well as on the `/api/sendToken` API. These can be configured from the `config.json` file. Rate limiting parameters for chains are passed in the chain configuration as shown above. 

```json
"GLOBAL_RL": {
    "REVERSE_PROXIES": 2,
    "MAX_LIMIT": 15,
    "WINDOW_SIZE": 1,
    "PATH": "/",
    "SKIP_FAILED_REQUESTS": false
}
```

## Captcha Verification

Captcha is required to prove the user is a human and not a bot. For this purpose, we will use [Google's Recaptcha](https://www.google.com/recaptcha/intro/v3.html). The server side will require `CAPTCHA_SECRET` that should not be exposed.

You can disable these Captcha verifications and rate limiters for testing the purpose, by tweaking in the `server.ts` file.

### Disabling Rate Limiters

Comment or remove these 2 lines from the `server.ts` file

```javascript
new RateLimiter(app, [GLOBAL_RL]);
new RateLimiter(app, evmchains);
```

### Disabling Captcha Verification

Remove the  `captcha.middleware` from `sendToken` API.

## Starting the Faucet

Follow the below commands to start your local faucet.

### Installing Dependencies

This will concurrently install dependencies for both client and server.

```bash
npm install
```

If ports have a default configuration, then the client will start at port 3000 and the server will start at port 8000 while in development mode.

### Starting in Development Mode

This will concurrently start the server and client in development mode.

```bash
npm run dev
```

### Building for Production

The following command will build server and client at `server/build` and `build` directories.

```bash
npm run build
```

### Starting in Production Mode

This command should only be run after successfully building the client and server-side code.

```bash
npm start
```