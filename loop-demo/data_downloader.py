import os
import json
import yfinance as yf
import pandas as pd
import numpy as np

ASSETS_META = [
    {
        "id": "NVDA",
        "ticker": "NVDA",
        "name": "NVIDIA Corp (Semiconductors / AI)",
        "period": "5y",
        "difficulty": "High Volatility",
        "lore": "The undisputed king of accelerated computing and AI GPUs. Known for violent swings, earnings gaps, and massive runs.",
        "multiplier": 1.0,
        "spread_factor": 0.0008,
        "min_spread": 0.04
    },
    {
        "id": "TSLA",
        "ticker": "TSLA",
        "name": "Tesla Inc (Electric Vehicles / Tech)",
        "period": "5y",
        "difficulty": "Extreme Momentum",
        "lore": "Retail favorite with legendary gamma squeezes, steep corrections, and extreme intraday velocity.",
        "multiplier": 1.0,
        "spread_factor": 0.001,
        "min_spread": 0.05
    },
    {
        "id": "BTC-USD",
        "ticker": "BTC-USD",
        "name": "Bitcoin (Crypto Benchmark)",
        "period": "5y",
        "difficulty": "Wild Rollercoaster",
        "lore": "24/7 crypto volatility. Parabolic rallies, liquidation cascades, and multi-thousand dollar daily moves.",
        "multiplier": 0.1,
        "spread_factor": 0.0008,
        "min_spread": 2.0
    },
    {
        "id": "SPY",
        "ticker": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "period": "5y",
        "difficulty": "Benchmark Equity",
        "lore": "The standard of global equity markets. Massive institutional liquidity, trend persistence, and sharp volatility shocks.",
        "multiplier": 1.0,
        "spread_factor": 0.0004,
        "min_spread": 0.02
    },
    {
        "id": "GME",
        "ticker": "GME",
        "name": "GameStop Corp (Meme Stock Pioneer)",
        "period": "5y",
        "difficulty": "Insane Squeezes",
        "lore": "The epicenter of the retail vs hedge fund revolution. Astronomical percentage moves and sudden halts.",
        "multiplier": 1.0,
        "spread_factor": 0.002,
        "min_spread": 0.05
    },
    {
        "id": "AAPL",
        "ticker": "AAPL",
        "name": "Apple Inc (Consumer Tech Giant)",
        "period": "5y",
        "difficulty": "Smooth Trend",
        "lore": "The multi-trillion dollar tech fortress. Consistent institutional accumulation with deep cyclical pullbacks.",
        "multiplier": 1.0,
        "spread_factor": 0.0004,
        "min_spread": 0.02
    },
    {
        "id": "AMD",
        "ticker": "AMD",
        "name": "Advanced Micro Devices",
        "period": "5y",
        "difficulty": "High Beta Tech",
        "lore": "High-beta semiconductor pioneer. Sharp rallies and deep cyclical drawdowns across gaming and datacenter cycles.",
        "multiplier": 1.0,
        "spread_factor": 0.0008,
        "min_spread": 0.04
    },
    {
        "id": "QQQ",
        "ticker": "QQQ",
        "name": "Invesco QQQ Trust (Nasdaq 100)",
        "period": "5y",
        "difficulty": "Tech Momentum",
        "lore": "The tech-heavy powerhouse index tracking top non-financial innovative giants.",
        "multiplier": 1.0,
        "spread_factor": 0.0005,
        "min_spread": 0.03
    }
]

def fetch_and_format_asset(meta):
    print(f"Downloading deep history for {meta['ticker']} (period={meta['period']})...")
    df = yf.download(meta['ticker'], period=meta['period'], progress=False)
    
    if df.empty:
        print(f"Warning: No data for {meta['ticker']}")
        return None
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    candles = []
    atrs = []
    
    for idx, row in df.iterrows():
        date_str = str(idx)[:10]
        o = float(row['Open'])
        h = float(row['High'])
        l = float(row['Low'])
        c = float(row['Close'])
        v = float(row['Volume']) if 'Volume' in row and not pd.isna(row['Volume']) else 0
        
        atr = max(0.01, h - l)
        atrs.append(atr / c)
        spread = max(meta['min_spread'], round(atr * meta['spread_factor'], 3))
        
        candles.append({
            "date": date_str,
            "open": round(o, 2),
            "high": round(h, 2),
            "low": round(l, 2),
            "close": round(c, 2),
            "volume": int(v),
            "spread": spread
        })
        
    avg_atr_pct = float(np.mean(atrs)) if atrs else 0.025
    
    asset_data = dict(meta)
    asset_data["candles"] = candles
    asset_data["count"] = len(candles)
    asset_data["avg_atr_pct"] = round(avg_atr_pct, 4)
    asset_data["start_price"] = candles[0]["open"] if candles else 100
    asset_data["end_price"] = candles[-1]["close"] if candles else 100
    asset_data["min_price"] = round(min(c["low"] for c in candles), 2)
    asset_data["max_price"] = round(max(c["high"] for c in candles), 2)
    asset_data["period_desc"] = f"{candles[0]['date']} to {candles[-1]['date']}"
    return asset_data

def main():
    os.makedirs("D:/Caynex/minigames/data", exist_ok=True)
    catalog = []
    
    for meta in ASSETS_META:
        try:
            asset = fetch_and_format_asset(meta)
            if asset and asset["candles"]:
                catalog_item = {k: v for k, v in asset.items() if k != "candles"}
                catalog_item["preview_candles"] = asset["candles"][:15]
                catalog.append(catalog_item)
                
                # Save deep asset dataset
                with open(f"D:/Caynex/minigames/data/level_{asset['id']}.json", "w") as f:
                    json.dump(asset, f, indent=2)
                print(f"Saved {asset['id']} with {asset['count']} historical candles ({asset['period_desc']}).")
        except Exception as e:
            print(f"Error fetching {meta['id']}: {e}")
            
    with open("D:/Caynex/minigames/data/levels_catalog.json", "w") as f:
        json.dump(catalog, f, indent=2)
    print(f"Successfully generated catalog with {len(catalog)} deep historical assets!")

if __name__ == "__main__":
    main()
