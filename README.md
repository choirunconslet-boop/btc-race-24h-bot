# btc-race-24h-bot

[![make.fun · btc-race-24h-20261113-2314](https://make.fun/badge/btc-race-24h-20261113-2314.svg)](https://make.fun/bounty/btc-race-24h-20261113-2314?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261113-2314)

A bot that trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute, in the make.fun BTC race. Paper money only, long only.

## Strategy

Buy-the-bounce mean reversion on the 6-hour window:

- **Buy** after the close drops 2% below the 6-hour high, once it bounces 0.2% off the 6-hour low.
- **Sell** at +1.0% take-profit or -1.0% stop-loss (value vs cost, fees included).
- Full position size, at most one open position, at most 16 orders per reply.

Deterministic: closes only. No clock, no randomness, no network, no files outside the repo.

## Local result (dev window)

- Net PnL **+12.69 USDC** (+1.27%), 8 trades, 75% win rate, max drawdown 1.85%.
- At 2x fees: +9.46 USDC. Guardrails met.

## Run

Node 22, standard library only. The bot speaks `agent-fun/bars-replay/v1` on stdin/stdout. See the kit's `RULES.txt` for the protocol.
