"""
BULLIMIA MARKET DATA FABRIC (Layer 2)
Universal data engine supporting:
- Deep historical replay from pre-downloaded 5-year daily sets (NVDA, TSLA, BTC, SPY, etc.)
- Random historical epoch dropping
- Sub-candle tick interpolation for smooth 60fps autoscroller physics
- Volatility calibration & Logarithmic scale generation
- Real-time 15-minute delayed market feed connector (Yahoo / Broker fallback)
"""

import os
import json
import random
from typing import Dict, Any, List, Optional
import yfinance as yf


class MarketDataFabric:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.catalog = self._load_catalog()

    def _load_catalog(self) -> List[Dict[str, Any]]:
        catalog_path = os.path.join(self.data_dir, "levels_catalog.json")
        if os.path.exists(catalog_path):
            with open(catalog_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def get_level(self, level_id: str, random_epoch: bool = False, min_candles: int = 150) -> Dict[str, Any]:
        """
        Loads level data for a ticker or scenario.
        If random_epoch is True, drops the player into a random slice of history with at least min_candles remaining.
        """
        file_path = os.path.join(self.data_dir, f"level_{level_id}.json")
        if not os.path.exists(file_path):
            # Fallback to NVDA if missing
            file_path = os.path.join(self.data_dir, "level_NVDA.json")
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Neither level_{level_id}.json nor level_NVDA.json found in {self.data_dir}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        candles = data.get("candles", [])
        total_candles = len(candles)

        start_index = 0
        if random_epoch and total_candles > (min_candles + 30):
            max_start = total_candles - min_candles
            start_index = random.randint(20, max_start)

        # Volatility-calibrated logarithmic scaling factor
        avg_atr_pct = data.get("avg_atr_pct", 0.028)
        log_scale = round(48.0 / avg_atr_pct, 2)

        return {
            "id": data.get("id", level_id),
            "ticker": data.get("ticker", level_id),
            "name": data.get("name", level_id),
            "lore": data.get("lore", "Surfing historical financial market price action."),
            "candles": candles,
            "total_candles": total_candles,
            "start_index": start_index,
            "avg_atr_pct": avg_atr_pct,
            "log_scale": log_scale,
            "initial_price": candles[start_index]["open"] if candles else 100.0,
            "start_date": candles[start_index]["date"] if candles else "2020-01-01"
        }

    def fetch_live_or_custom_ticker(self, ticker: str, period: str = "2y", interval: str = "1d") -> Dict[str, Any]:
        """
        Fetches fresh data for any global ticker and calibrates it for Bullimia physics.
        """
        t = yf.Ticker(ticker)
        df = t.history(period=period, interval=interval)
        if df.empty:
            raise ValueError(f"No market data found for ticker '{ticker}'")

        candles = []
        atrs = []

        for idx, (ts, row) in enumerate(df.iterrows()):
            o = float(row['Open'])
            h = float(row['High'])
            l = float(row['Low'])
            c = float(row['Close'])
            v = float(row['Volume'])
            date_str = ts.strftime('%Y-%m-%d')
            candles.append({
                "index": idx,
                "date": date_str,
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
                "volume": int(v)
            })

            # ATR calculation
            tr = max(h - l, abs(h - o), abs(l - o))
            atrs.append(tr / o if o > 0 else 0.02)

        avg_atr_pct = float(sum(atrs) / len(atrs)) if atrs else 0.025
        log_scale = round(48.0 / avg_atr_pct, 2)

        level_data = {
            "id": ticker.upper(),
            "name": f"{ticker.upper()} Live Market",
            "ticker": ticker.upper(),
            "lore": f"Real historical market data for {ticker.upper()}.",
            "candles": candles,
            "total_candles": len(candles),
            "start_index": 0,
            "avg_atr_pct": round(avg_atr_pct, 4),
            "log_scale": log_scale,
            "initial_price": candles[0]["open"],
            "start_date": candles[0]["date"]
        }

        # Cache locally
        out_file = os.path.join(self.data_dir, f"level_{ticker.upper()}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(level_data, f, indent=2)

        return level_data
