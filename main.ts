/* BTC race bot: buy-the-bounce on CBBTC, long only.
Buys after a 2% drop from the 6h high, once price bounces 0.2% off the 6h low.
Sells at +1.0% take-profit or -1.0% stop-loss (on value vs cost, fees included).
Deterministic: closes only, no clock, no randomness, no network. */
import { BPS, runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const LOOKBACK = 360;
const DROP_NUM = 980n;      // buy only if close <= high * 0.98 (2% below 6h high)
const DROP_DEN = 1000n;
const RISE_NUM = 1002n;     // and close >= low * 1.002 (0.2% above 6h low)
const RISE_DEN = 1000n;
const TP_NUM = 1010n;       // take profit +1.0% (value vs cost)
const TP_DEN = 1000n;
const SL_NUM = 990n;        // stop loss -1.0% (value vs cost)
const SL_DEN = 1000n;
const MAX_SLIPPAGE_BPS = 100;

const closes: number[] = [];

await runBars({
  onBatch(state, batch) {
    for (const bar of batch.bars) {
      if (bar.symbol !== SYMBOL) continue;
      closes.push(Number(bar.c));
    }
    if (state.warmingUp) return [];
    if (closes.length < LOOKBACK) return [];
    const window = closes.slice(closes.length - LOOKBACK);
    let hi = window[0];
    let lo = window[0];
    for (const c of window) { if (c > hi) hi = c; if (c < lo) lo = c; }
    const latest = state.close(SYMBOL);
    if (latest === null) return [];
    const held = state.positions.get(SYMBOL);
    if (held !== undefined) {
      const value = state.value(SYMBOL, held.qty);
      if (value * TP_DEN >= held.cost * TP_NUM || value * SL_DEN <= held.cost * SL_NUM) {
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS } satisfies SellInput];
      }
      return [];
    }
    const latestN = BigInt(Math.round(Number(latest)));
    const hiN = BigInt(Math.round(hi));
    const loN = BigInt(Math.round(lo));
    // Dropped 2% from the 6h high AND bounced 0.2% off the 6h low.
    if (latestN * DROP_DEN > hiN * DROP_NUM) return [];
    if (latestN * RISE_DEN < loN * RISE_NUM) return [];
    const { caps, fees } = state.hello;
    const byWeight = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
    const amount = state.cash < byWeight ? state.cash : byWeight;
    if (amount <= 0n || amount < BigInt(fees.min_notional_quote_units)) return [];
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: MAX_SLIPPAGE_BPS } satisfies BuyInput];
  },
});
