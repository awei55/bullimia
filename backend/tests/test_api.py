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


def test_dev_warp_and_godmode():
    # Warp to $1,000,000 (Phase 2)
    res_1m = client.post("/api/dev/warp", json={"equity": 1000000.0})
    assert res_1m.status_code == 200
    assert res_1m.json()["account"]["equity"] == 1000000.0
    assert res_1m.json()["account"]["is_millionaire"] is True

    # Warp to $10,000,000 (Phase 3)
    res_10m = client.post("/api/dev/warp", json={"equity": 10000000.0})
    assert res_10m.status_code == 200
    assert res_10m.json()["account"]["equity"] == 10000000.0

    # Warp to $100,000,000 (Phase 4)
    res_100m = client.post("/api/dev/warp", json={"equity": 100000000.0})
    assert res_100m.status_code == 200
    assert res_100m.json()["account"]["equity"] == 100000000.0

    # Test God Mode
    res_gm = client.post("/api/dev/godmode", json={"enabled": True})
    assert res_gm.status_code == 200
    assert res_gm.json()["god_mode"] is True


def test_save_and_load_roundtrip():
    sample_save = {
        "account": {
            "cash_balance": 45000.0,
            "equity": 45000.0,
            "side": "BULL",
            "open_lots": 10,
            "entry_price": 130.0,
            "entry_timestamp": "2024-03-01",
            "unrealized_pnl": 500.0,
            "trade_count": 3,
            "winning_trades": 2,
            "losing_trades": 1,
            "high_watermark": 46000.0
        },
        "currentLevelId": "NVDA",
        "playerProgress": 142.5,
        "phase": "PHASE_1_CHART",
        "tradeHistory": [
            {
                "id": 1,
                "ticker": "NVDA",
                "side": "BULL",
                "entry_price": 120.0,
                "exit_price": 125.0,
                "lots": 5,
                "entry_timestamp": "2024-01-02",
                "exit_timestamp": "2024-01-05",
                "pnl": 250.0,
                "commission_paid": 5.0,
                "is_win": True
            }
        ]
    }

    # Save
    res_save = client.post("/api/save", json={"data": sample_save})
    assert res_save.status_code == 200

    # Load
    res_load = client.get("/api/save")
    assert res_load.status_code == 200
    load_data = res_load.json()
    assert load_data["has_save"] is True
    assert load_data["data"]["currentLevelId"] == "NVDA"
    assert load_data["data"]["account"]["cash_balance"] == 45000.0
    assert load_data["data"]["account"]["open_lots"] == 10

    # Delete save
    res_del = client.post("/api/save/delete")
    assert res_del.status_code == 200
    assert res_del.json()["account"]["equity"] == 10000.0
