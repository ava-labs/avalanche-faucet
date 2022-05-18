# Faucet Server and Client

This repository has both server and client that is required to host a faucet for your EVM subnet. We have used ReactJS client for interacting with the Node.js Faucet Server.

## Requirements

* [Node](https://nodejs.org/en) >= 17.0 and [npm](https://www.npmjs.com/) >= 8.0
* [Google's ReCaptcha](https://www.google.com/recaptcha/intro/v3.html) v3 keys

## Installation

Clone this repository at your preferred location.

```bash
git clone https://github.com/ava-labs/faucet
```

## Client Side Configurations

We need to configure our application with the server API endpoints and Captcha site keys. All the client-side configurations are there in `src/config.json` file. Since there are no secrets on the client side, we do not need any environment variables. Update the config files according to your need.

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

In the above file, there are 2 base endpoints for the faucet server `apiBaseEndpointProduction` and `apiBaseEndpointDevelopment`. Since in production mode, client side will be served as static content, it will be served over server's endpoint, and hence we do not have to provide server's IP address or domain. It should be a valid URL where the server's APIs are hosted. If the endpoints for API has a leading `/v1/api` and the server is running on localhost at port 3000, then you should use `http://localhost:3000/v1/api` or `/v1/api/` depending on whether it is production or development.

## Server Side Configuration

On server-side, we need to configure 2 files - `server/.env` for secret keys and `server/config.json` for chain and API's rate limiting configurations.

### Setup Environment Variables

Setup the environment variable with your private key and recaptcha secret. Make a `.env` file inside the `/server` directory with following credentials. The faucet server can handle multiple EVM chains, and threfore requires private keys for addresses with funds on each of the chain.

If you have funds on the same address on every chain, then you can just use `PK` variable. But if you have funds on different addresses on different chains, then you can provide each of the private key against their chain name, as shown below.

```env
C="C chain private key"
WAGMI="Wagmi chain private key"
PK="Sender Private Key with Funds in it"
CAPTCHA_SECRET="Google ReCaptcha Secret"
```
### Setup EVM Chain Configurations

You can create faucet server for any EVM chain by making changes in the `config.json` file. Add your chain configuration like shown below in the `evmchains` object. Configuration for Fuji's C-Chain and WAGMI chain is shown below for example.

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

The rate limiter for C Chain will only accept 1 request in 60 minutes for a particular API and 2 requests in 60 minutes for WAGMI chain. Though it will skip any failed requests, so that users can request tokens again, even if there is some internal error in the application. On the other hand, global rate limiter will allow 15 requests per minute on every API. This time failed requests will also get countend so that no one can abuse the APIs.

## API Endpoints

This server will expose the following APIs

### Health API

The `/health` API will alaways return response with `200` status code. This endpoint can be used to know the health of the server.

```bash
curl http://localhost:8000/health
```

Response

```bash
Server healthy
```

### Get Drop Size

This api will be used for fetching the drop amount that the faucet server is providing per request.

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

This API endpoint will handle token requests from users. It will return the transaction hash as a receipt of faucet drip.

```bash
curl -d '{
        "address": "0x3EA53fA26b41885cB9149B62f0b7c0BAf76C78D4"
        "chain": "C"
}' -H 'Content-Type: application/json' http://localhost:8000/api/sendToken
```

Send token API requires Captcha response token that is generated using Captcha site key on the client side. Since we can't generate and pass this token while making curl request, we have to disable the captcha verification for testing purpose. You can find the steps to disable it in the next sections. Response is shown below

```bash
{
    "message": "Transaction successful on Avalanche C Chain!",
    "txHash": "0x3d1f1c3facf59c5cd7d6937b3b727d047a1e664f52834daf20b0555e89fc8317"
}
```

## Rate Limiters

The rate limiters are applied on the global (all endpoints) as well as on `/api/sendToken` API. These can be configured from `config.json` file. Rate limiting parameters for chains are passed in the chain configuration as shown above. 

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

Captcha is required to prove the user is a human and not a bot. For this purpose we will use [Google's Recaptcha](https://www.google.com/recaptcha/intro/v3.html). Server side will require `CAPTCHA_SECRET` that should not be exposed.

You can disable these Captcha verifications and rate limiters for testing the purpose, by tweaking in the `server.ts` file.

### Disabling Rate Limiters

Comment or remove these 2 lines from `server.ts` file

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

If ports have default configuration, then the client will start at port 3000 and the server will start at port 8000 while in development mode.

### Starting in Development Mode

This will concurrently start server and client in development mode.

```bash
npm run dev
```

### Building for Production

The following command will build server and client at `server/build` and `build` directories.

```bash
npm run build
```

### Starting in Production Mode

This command should only be run after successfully building the client and server side code.

```bash
npm start
```