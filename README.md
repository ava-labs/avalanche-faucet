# Faucet Server

This is a facuet server for subnets with rate limiter, concurrency control and captcha verification.

## API Endpoints

This server will expose the following APIs

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
}' -H 'Content-Type: application/json' http://localhost:8000/api/sendToken
```

Send token API requires Captcha response token that is generated using Captcha site key on the client side. Since we can't generate and pass this token while making curl request, we have to disable the captcha verification for testing purpose. You can find the steps to disable it in the next sections. Response is shown below

```bash
{
    "message": "Transaction successful!",
    "txHash": "0x3d1f1c3facf59c5cd7d6937b3b727d047a1e664f52834daf20b0555e89fc8317"
}
```

## Rate Limiters

The rate limiters are applied on the global as well as on `/api/sendToken` API. These can be configured from `config.json` file. Currently 

```json
"GLOBAL_RL": {
    "REVERSE_PROXIES": 2,
    "MAX_LIMIT": 15,
    "WINDOW_SIZE": 1,
    "PATH": "/",
    "SKIP_FAILED_REQUESTS": false
},
"SEND_TOKEN_RL": {
    "REVERSE_PROXIES": 2,
    "MAX_LIMIT": 1,
    "WINDOW_SIZE": 60,
    "PATH": "/sendToken",
    "SKIP_FAILED_REQUESTS": true
}
```
With the above configurations the `SEND_TOKEN` rate limiter will only 1 request in 60 minutes. Though it will skip any failed requests, so that users can request tokens again, even if there is some internal error in the application. On the other hand, global rate limiter will allow 15 requests per minute on every API. This time failed requests will also get countend so that no one can abuse the APIs.

## Captcha Verification

Captcha is required to prove the user is a human and not a bot. For this purpose we will use [Google's Recaptcha](https://www.google.com/recaptcha/intro/v3.html). Server side will require `CAPTCHA_SECRET` that should not be exposed.

You can disable these Captcha verifications and rate limiters for testing the purpose, by tweaking in the `server.ts` file.

### Disabling Rate Limiters

Comment or remove these 2 lines from `server.ts` file

```javascript
new RateLimiter(app, GLOBAL_RL);
new RateLimiter(app, SEND_TOKEN_RL);
```

### Disabling Captcha Verification

Remove the  `captcha.middleware` from `sendToken` API.