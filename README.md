# Khalani Tokens Faucet

Khalani Protocol connects multiple chains, and on each chain there are USD-like ERC-20 test tokens deployed.

This project provides a user-friendly faucet forked from [Avalanche Faucet](https://github.com/ava-labs/avalanche-faucet)
to allow users and external developers get some test tokens:
- Khalani Chain native token `KHA`
- Sepolia (`USDC` / `USDT`)
- Avalanche Fuji (`USDC` / `USDT`)
- Polygon Mumbai (`USDC` / `USDT`)
- BSC Testnet (`USDC` / `USDT` / `BUSD`)
- Arbitrum Goerli (`USDC` / `USDT`)
- Optimism Goerli (`USDC` / `USDT`)
- Godwoken (`USDC` / `USDT`)

![faucet.png](docs%2Ffaucet.png)

# Original fork changes
Compared to the original fork, this repository adopts the code for Khalani protocol: 
- allow to configure faucet from a file specified by `CONFIG_FILE`
- allow to override RPC URLs with ENV variables of name `EVM_CHAINS_${ID}_RPC`, where `ID` is the chain ID 
specified in `evmchains` of `config.json`, for example `EVM_CHAINS_KHALANITESTNET_RPC` — needed to move RPC URLs to mountable Kubernetes `Secret`s.
- allow to disable captcha verification — needed to test the deployment and then register Google Captcha for the production domain
- added Khalani Protocol branding (logo / docs)