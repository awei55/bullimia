"""
BULLIMIA LOCAL API & WEBSOCKET SERVER
Powers the Tauri / Svelte front-end with sub-millisecond market execution,
deterministic quant accounting, and historical level streaming.
"""

import os
import sys
import json
from typing import Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Ensure package import
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from bullimia_quant.kernel import QuantKernel, PositionSide
from bullimia_quant.streaming import MarketDataFabric

DATA_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "data"))
SAVES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "saves"))
os.makedirs(SAVES_DIR, exist_ok=True)
SAVE_FILE = os.path.join(SAVES_DIR, "career_save.json")

app = FastAPI(title="Bullimia Quant Backend", version="2.0.0")

# Enable CORS for local Vite and Tauri dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fabric = MarketDataFabric(data_dir=DATA_DIR)
kernel = QuantKernel(starting_cash=1000.0)


class OrderRequest(BaseModel):
    ticker: str
    side: str   # "BULL", "BEAR", "FLAT"
    lots: int = 1
    current_price: float
    timestamp: str
    atr_pct: float = 0.02


class MarkToMarketRequest(BaseModel):
    current_price: float
    atr_pct: float = 0.02


class ResetRequest(BaseModel):
    starting_cash: float = 10000.0


class SavePayload(BaseModel):
    data: Dict[str, Any]


class WarpPayload(BaseModel):
    equity: float


class GodModePayload(BaseModel):
    enabled: bool


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "2.0.0", "engine": "Bullimia Quant"}


@app.get("/api/catalog")
def get_catalog():
    return {"levels": fabric.catalog}


@app.get("/api/level/{level_id}")
def get_level(level_id: str, random_epoch: bool = Query(default=False)):
    try:
        data = fabric.get_level(level_id, random_epoch=random_epoch)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/custom/{ticker}")
def fetch_custom_ticker(ticker: str):
    try:
        return fabric.fetch_live_or_custom_ticker(ticker)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/order")
def execute_order(req: OrderRequest):
    side_map = {
        "BULL": PositionSide.BULL,
        "BEAR": PositionSide.BEAR,
        "FLAT": PositionSide.FLAT
    }
    desired_side = side_map.get(req.side.upper(), PositionSide.FLAT)
    result = kernel.execute_order(
        ticker=req.ticker,
        desired_side=desired_side,
        lots=req.lots,
        current_price=req.current_price,
        timestamp=req.timestamp,
        atr_pct=req.atr_pct
    )
    return result


@app.post("/api/mark-to-market")
def mark_to_market(req: MarkToMarketRequest):
    acc = kernel.update_mark_to_market(req.current_price, req.atr_pct)
    quotes = kernel.get_quotes(req.current_price, req.atr_pct)
    return {"account": acc.to_dict(), "quotes": quotes}


@app.get("/api/account")
def get_account():
    return {
        "account": kernel.account.to_dict(),
        "recent_trades": [
            {
                "id": t.id,
                "ticker": t.ticker,
                "side": t.side.value,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "lots": t.lots,
                "pnl": round(t.pnl, 2),
                "is_win": t.is_win
            } for t in kernel.trade_history[-20:]
        ]
    }


@app.post("/api/reset")
def reset_career(req: ResetRequest):
    kernel.reset_career(req.starting_cash)
    if os.path.exists(SAVE_FILE):
        try:
            os.remove(SAVE_FILE)
        except Exception:
            pass
    return {"account": kernel.account.to_dict()}


@app.post("/api/save")
def save_career(payload: SavePayload):
    try:
        with open(SAVE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload.data, f, indent=2)
        # Synchronize kernel state if account is provided
        if "account" in payload.data:
            kernel.restore_state(payload.data["account"], payload.data.get("tradeHistory"))
        return {"status": "ok", "message": "Career save recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/save")
def load_career():
    if not os.path.exists(SAVE_FILE):
        return {"has_save": False, "data": None}
    try:
        with open(SAVE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "account" in data:
            kernel.restore_state(data["account"], data.get("tradeHistory"))
        return {"has_save": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/save/delete")
def delete_career_save():
    if os.path.exists(SAVE_FILE):
        os.remove(SAVE_FILE)
    kernel.reset_career(1000.0)
    return {"status": "ok", "account": kernel.account.to_dict()}


@app.post("/api/wire")
def inject_benefactor_wire():
    kernel.account.cash_balance += 9000.0
    kernel.account.equity += 9000.0
    kernel.account.free_margin += 9000.0
    return {"status": "ok", "account": kernel.account.to_dict()}


@app.post("/api/dev/warp")
def dev_warp_equity(payload: WarpPayload):
    kernel.set_equity(payload.equity)
    return {"status": "ok", "account": kernel.account.to_dict()}


@app.post("/api/dev/godmode")
def dev_toggle_godmode(payload: GodModePayload):
    kernel.god_mode = payload.enabled
    return {"status": "ok", "god_mode": kernel.god_mode}


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "mark_to_market":
                price = data.get("price", 100.0)
                atr = data.get("atr_pct", 0.02)
                acc = kernel.update_mark_to_market(price, atr)
                quotes = kernel.get_quotes(price, atr)
                await websocket.send_json({
                    "type": "account_update",
                    "account": acc.to_dict(),
                    "quotes": quotes
                })
            elif action == "order":
                side_str = data.get("side", "FLAT").upper()
                side = PositionSide[side_str] if side_str in PositionSide.__members__ else PositionSide.FLAT
                res = kernel.execute_order(
                    ticker=data.get("ticker", "NVDA"),
                    desired_side=side,
                    lots=data.get("lots", 1),
                    current_price=data.get("price", 100.0),
                    timestamp=data.get("timestamp", ""),
                    atr_pct=data.get("atr_pct", 0.02)
                )
                await websocket.send_json({
                    "type": "order_result",
                    "data": res
                })
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    port = int(os.environ.get("BULLIMIA_PORT", 8000))
    print(f"Starting Bullimia Quant Server on port {port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
