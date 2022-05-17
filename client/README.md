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
    "apiBaseEndpoint": "https://test-faucet.network/api",
    "apiTimeout": 10000,
    "CAPTCHA": {
        "siteKey": "6LcNScYfAAAAAJH8fauA-okTZrmAxYqfF9gOmujf",
        "action": "faucetdrip"
    }
}
```

Put the Google's ReCaptcha site-key without which the faucet client can't send the necessary captcha response to the server. This key is not a secret and could be public.

In the above file, `apiBaseEndpoint` is the base endpoint of the faucet server. It should be a valid URL where the server's APIs are hosted. If the endpoints for API has a leading `/v1/api` and the server is running on localhost at port 3000, then you should use `http://localhost:3000/v1/api`.

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
TOTPKEY="Base32 string with minimum 16 characters"
```

**TOTP** Key is a [Base32](https://en.wikipedia.org/wiki/Base32) string with minimum 16 characters, that will be used for authenticating secured API endpoints like `/api/recalibration`. These APIs are requested with a `token` query parameter, which is a time based 6-digit token, created with the help of `TOTPKEY`. A new key will be passively generated every 30 seconds on the basis of current timestamp. You can use **Google Auth** mobile application or any TOTP providers and setup them with the `TOTPKEY` for getting a new token every 30 seconds.

```bash
curl -X GET "http://localhost:8000/api/recalibrate?token=617840"
```

### Setup EVM Chain Configurations

You can create faucet server for any EVM chain by making changes in the `config.json` file. Add your chain configuration like shown below in the `evmchains` object. Configuration for Fuji's C-Chain and WAGMI chain is shown below for example.

```json
"evmchains": [
    {
        "NAME": "C",
        "TOKEN": "AVAX",
        "RPC": "https://api.avax-test.network/ext/C/rpc",
        "MAX_PRIORITY_FEE": "2000000000",
        "MAX_FEE": "100000000000",
        "DRIP_AMOUNT": 10000000000
    },
    {
        "NAME": "WAGMI",
        "TOKEN": "WGM",
        "RPC": "https://subnets.avax.network/wagmi/wagmi-chain-testnet/rpc",
        "MAX_PRIORITY_FEE": "2000000000",
        "MAX_FEE": "100000000000",
        "DRIP_AMOUNT": 10000000
    }
]
```
In the above configuration drip amount is in `nAVAX` or `gwei`, whereas fees are in `wei`. For example, with the above configurations, the faucet will send `1 AVAX` with maximum fees per gas being `100 nAVAX` and priority fee as `2 nAVAX`.

## Starting the Faucet

Follow the below commands to start your local faucet.

### Installing Dependencies

This will concurrently install dependencies for both client and server.

```bash
npm install
```

If ports have default configuration, then the client will start at port 3000 and the server will start at port 8000.

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
