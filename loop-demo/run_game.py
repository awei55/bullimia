import os
import sys
import time
import webbrowser
import threading
from server import run, PORT

# Force utf-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def open_browser():
    time.sleep(1.2)
    url = f"http://localhost:{PORT}/"
    print(f"\n[BULLIMIA] Opening game in your browser: {url}")
    webbrowser.open(url)

def main():
    print("=" * 60)
    print("BULLIMIA: The Candlestick Trading Autoscroller")
    print("=" * 60)
    print(f"Starting server on port {PORT}...")
    
    # Launch browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run the HTTP & yfinance API server
    try:
        run(PORT)
    except KeyboardInterrupt:
        print("\nGame server stopped. Thanks for playing Bullimia!")

if __name__ == "__main__":
    main()
