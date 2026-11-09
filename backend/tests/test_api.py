import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["engine"] == "Bullimia Quant"


def test_catalog_endpoint():
    res = client.get("/api/catalog")
    assert res.status_code == 200
    data = res.json()
    assert "levels" in data
    assert len(data["levels"]) > 0


def test_level_endpoint():
    res = client.get("/api/level/NVDA")
    assert res.status_code == 200
    data = res.json()
    assert data["ticker"] == "NVDA"
    assert len(data["candles"]) > 0
    assert "log_scale" in data


def test_order_and_mark_to_market_flow():
    # 1. Reset account
    client.post("/api/reset", json={"starting_cash": 10000.0})

    # 2. Execute BULL order
    res = client.post("/api/order", json={
        "ticker": "NVDA",
        "side": "BULL",
        "lots": 5,
        "current_price": 120.0,
        "timestamp": "2024-01-02",
        "atr_pct": 0.02
    })
    assert res.status_code == 200
    data = res.json()
    assert data["account"]["side"] == "BULL"
    assert data["account"]["open_lots"] == 5

    # 3. Mark to market at higher price
    res_mtm = client.post("/api/mark-to-market", json={
        "current_price": 125.0,
        "atr_pct": 0.02
    })
    assert res_mtm.status_code == 200
    mtm_data = res_mtm.json()
    assert mtm_data["account"]["unrealized_pnl"] > 0

    # 4. Flatten position to cash
    res_flat = client.post("/api/order", json={
        "ticker": "NVDA",
        "side": "FLAT",
        "lots": 5,
        "current_price": 125.0,
        "timestamp": "2024-01-05",
        "atr_pct": 0.02
    })
    assert res_flat.status_code == 200
    flat_data = res_flat.json()
    assert flat_data["account"]["side"] == "FLAT"
    assert flat_data["account"]["winning_trades"] == 1
    assert flat_data["closed_trade"]["is_win"] is True
