# Faucet Server and Client

This repository has both server and client that is required to host a faucet for your EVM subnet. We have used ReactJS client for interacting with the Node.js Faucet Server.

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

Put the Google's ReCaptcha site-key without which the faucet client can't send the necessary captcha response to the server.

In the above file, `apiBaseEndpoint` is the base endpoint of the faucet server. It should be a valid URL where the server's APIs are hosted. If the endpoints for API has a leading `/v1/api` and the server is running on localhost at port 3000, then you should use `http://localhost:3000/v1/api`.

## Server Side Configuration

On server-side, we need to configure 2 files - `server/.env` for secret keys and `server/config.json` for chain and API's rate limiting configurations.

### Setup Environment Variables

Setup the environment variable with your private key and recaptcha secret. Make a `.env` file inside the `/server` directory with following credentials.

```env
PK="Sender Private Key with Funds in it"
CAPTCHA_SECRET="Google ReCaptcha Secret"
```

### Setup EVM Chain Configurations

You can create faucet server for any EVM chain by making changes in the `config.json` file. Add your chain configuration like shown below in the `evmchains` object. Configuration for Avalanche's C-Chain is added by default for example.

```json
"C": {
    "RPC": "https://api.avax-test.network/ext/C/rpc",
    "MAX_PRIORITY_FEE": "2000000000",
    "MAX_FEE": "100000000000",
    "DRIP_AMOUNT": 1000000000
}
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