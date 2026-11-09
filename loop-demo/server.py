import os
import sys
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import yfinance as yf
import pandas as pd

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class BullimiaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/levels":
            self.handle_get_levels()
        elif path.startswith("/api/level/"):
            level_id = path.replace("/api/level/", "").strip()
            self.handle_get_single_level(level_id)
        elif path == "/api/fetch_ticker":
            self.handle_fetch_ticker(query)
        elif path == "/api/health":
            self.send_json_response({"status": "ok", "game": "Bullimia"})
        else:
            # Fall back to serving static files
            super().do_GET()

    def send_json_response(self, data, status_code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def handle_get_levels(self):
        catalog_path = os.path.join(BASE_DIR, "data", "levels_catalog.json")
        if os.path.exists(catalog_path):
            with open(catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.send_json_response({"levels": data})
        else:
            self.send_json_response({"levels": []})

    def handle_get_single_level(self, level_id):
        level_file = os.path.join(BASE_DIR, "data", f"level_{level_id}.json")
        if os.path.exists(level_file):
            with open(level_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.send_json_response(data)
        else:
            self.send_json_response({"error": f"Level {level_id} not found"}, status_code=404)

    def handle_fetch_ticker(self, query):
        ticker = query.get("ticker", [""])[0].upper().strip()
        period = query.get("period", ["5y"])[0].strip()
        interval = query.get("interval", ["1d"])[0].strip()

        if not ticker:
            self.send_json_response({"error": "Ticker symbol is required"}, status_code=400)
            return

        try:
            print(f"Fetching real market data for custom ticker: {ticker} (period={period}, interval={interval})")
            t = yf.Ticker(ticker)
            df = t.history(period=period, interval=interval)

            if df is None or df.empty:
                self.send_json_response({"error": f"No market data found for ticker '{ticker}'"}, status_code=404)
                return

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            candles = []
            atrs = []
            for idx, row in df.iterrows():
                date_str = str(idx)[:10] if " " not in str(idx) else str(idx)[:16]
                o = float(row['Open'])
                h = float(row['High'])
                l = float(row['Low'])
                c = float(row['Close'])
                v = float(row['Volume']) if 'Volume' in row and not pd.isna(row['Volume']) else 0

                atr = max(0.01, h - l)
                atrs.append(atr / c)
                spread = max(0.02, round(atr * 0.001, 3))

                candles.append({
                    "date": date_str,
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2),
                    "volume": int(v),
                    "spread": spread
                })

            avg_atr_pct = float(pd.Series(atrs).mean()) if atrs else 0.025

            level_data = {
                "id": f"CUSTOM_{ticker}",
                "ticker": ticker,
                "name": f"{ticker}: Custom Market History",
                "period_desc": f"{candles[0]['date']} to {candles[-1]['date']}",
                "difficulty": "Custom User Ticker",
                "lore": f"Deep historical market data downloaded for {ticker}. Dropped into random market epoch!",
                "multiplier": 1.0,
                "spread_factor": 0.001,
                "min_spread": 0.02,
                "candles": candles,
                "count": len(candles),
                "avg_atr_pct": round(avg_atr_pct, 4),
                "start_price": candles[0]["open"] if candles else 100,
                "end_price": candles[-1]["close"] if candles else 100,
                "min_price": round(min(c["low"] for c in candles), 2),
                "max_price": round(max(c["high"] for c in candles), 2)
            }

            self.send_json_response(level_data)
        except Exception as e:
            print(f"Error fetching ticker {ticker}: {e}")
            self.send_json_response({"error": str(e)}, status_code=500)

            self.send_json_response(level_data)
        except Exception as e:
            print(f"Error fetching ticker {ticker}: {e}")
            self.send_json_response({"error": str(e)}, status_code=500)

def run(port=PORT):
    # Ensure stdout handles utf-8 safely
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    server_address = ('', port)
    httpd = HTTPServer(server_address, BullimiaHandler)
    print(f">> Bullimia Game Server running at http://localhost:{port}/")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    p = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run(p)
