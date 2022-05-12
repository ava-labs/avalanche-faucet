# Faucet Client

ReactJS client for interacting with the Faucet Server.

## Configurations

We need to configure our application with the server APIs and Captcha site keys. All the configurations are there in `src/config.json` file. Since there are no secrets on the client side, we do not need any environment variables. Update the config files according to your need.

```json
{
    "banner": "/banner.png",
    "apiBaseEndpoint": "http://localhost:3000",
    "apiTimeout": 10000,
    "CAPTCHA": {
        "siteKey": "6LcNScYfAAAAAJH8fauA-okTZrmAxYqfF9gOmujf",
        "action": "faucetdrip"
    }
}
```

Put the Google's ReCaptcha site-key without which the faucet client can't send the necessary captcha response to the server.

In the above file, `apiBaseEndpoint` is the base endpoint of the faucet server. If the endpoints for APIs has a leading `/api`, then you should use `http://localhost:3000/api`.

## Starting the Client

You can start the client after installing dependencies.

```bash
npm start
```