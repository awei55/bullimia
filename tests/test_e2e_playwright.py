import subprocess
import time
import os
import sys

# Ensure UTF-8 stdout on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

def run_e2e_test():
    print("1. Starting Backend with sys.executable & Frontend Vite...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server:app", "--app-dir", "backend", "--port", "8000"],
        cwd="D:\\Caynex\\minigames",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    frontend_proc = subprocess.Popen(
        ["cmd.exe", "/c", "npx vite --port 5173"],
        cwd="D:\\Caynex\\minigames",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Allow servers to start
    time.sleep(5)

    try:
        print("2. Launching Headless Chromium via Playwright...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("response", lambda resp: print(f"  [HTTP {resp.status}] {resp.url}") if resp.status >= 400 else None)
            
            print("3. Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", wait_until="networkidle", timeout=20000)

            # --- STEP 1: START SCREEN ---
            print("--- STEP 1: START SCREEN ---")
            page.wait_for_selector("text=BULLIMIA", timeout=10000)
            ss_start = "D:\\Caynex\\minigames\\screenshot_start_screen.png"
            page.screenshot(path=ss_start)
            print(f"Captured: {ss_start}")

            # --- STEP 2: START NEW CAREER (GENESIS TUTORIAL AT $1,000) ---
            print("--- STEP 2: GENESIS TUTORIAL START ($1,000) ---")
            page.click("text=START NEW CAREER")
            time.sleep(1.5)

            # Canvas and Chart elements
            page.wait_for_selector("canvas", timeout=10000)
            print("Canvas active and rendering!")

            # Take screenshot immediately to inspect HUD
            ss_genesis = "D:\\Caynex\\minigames\\screenshot_genesis_start.png"
            page.screenshot(path=ss_genesis)
            print(f"Captured: {ss_genesis}")

            # Print Total Equity text from page
            hud_text = page.locator("header").text_content()
            print(f"HUD Header Text: {hud_text}")

            import re
            m = re.search(r"TOTAL EQUITY \$([0-9,.]+)", hud_text)
            assert m is not None, "Could not find TOTAL EQUITY in HUD header!"
            initial_equity = float(m.group(1).replace(",", ""))
            print(f"Parsed initial live equity: ${initial_equity:.2f}")
            assert 700.0 <= initial_equity <= 1400.0, f"Initial equity should be ~$1,000 (with live PnL)! Got: {initial_equity}"
            print("Confirmed Initial Equity is active around $1,000 USD mark.")

            # Verify locked asset selector
            locked_banner = page.locator("text=SINGLE ASSET TUTORIAL REGIME")
            assert locked_banner.is_visible(), "Asset bar must be locked in Genesis tutorial!"
            print("Confirmed Asset Switcher is LOCKED (Single asset tutorial regime).")

            # Verify DESK / BOTS / PORTFOLIO tabs are NOT in DOM
            assert page.locator("button:has-text('DESK')").count() == 0, "Phase 2 DESK tab should be hidden at $1,000"
            assert page.locator("button:has-text('BOTS')").count() == 0, "Phase 3 BOTS tab should be hidden at $1,000"
            print("Confirmed advanced phase tabs are hidden.")

            # --- STEP 3: TRIGGER UNCLE GORDON WIRE (+ $9,000) ---
            print("--- STEP 3: UNCLE GORDON WIRE TRANSMISSION ---")
            page.click("text=DEV")
            page.wait_for_selector("text=DEV CONSOLE // PHASE & BALANCE WARPER", timeout=5000)
            page.click("text=TRIGGER UNCLE GORDON WIRE")
            time.sleep(0.5)
            page.click("text=CLOSE")

            # Wait for Benefactor Modal
            page.wait_for_selector("text=UNCLE GORDON", timeout=5000)
            print("Uncle Gordon Benefactor Modal triggered successfully!")

            ss_benefactor = "D:\\Caynex\\minigames\\screenshot_benefactor_wire.png"
            page.screenshot(path=ss_benefactor)
            print(f"Captured: {ss_benefactor}")

            # Accept Wire
            page.click("text=ACCEPT WIRE & START TRADING ASSETS")
            time.sleep(1)

            # Confirm Cash is now ~$10,000
            hud_text_after_wire = page.locator("header").text_content()
            m2 = re.search(r"TOTAL EQUITY \$([0-9,.]+)", hud_text_after_wire)
            assert m2 is not None, "Could not find TOTAL EQUITY after wire!"
            equity_post_wire = float(m2.group(1).replace(",", ""))
            print(f"Parsed equity after wire: ${equity_post_wire:.2f}")
            assert 8500.0 <= equity_post_wire <= 12000.0, f"Equity must be ~$10,000 after wire! Got: {equity_post_wire}"
            print("Confirmed Equity updated to ~$10,000 USD (+ $9,000 wire).")

            # Confirm Asset Switcher is now UNLOCKED
            page.wait_for_selector("button:has-text('AAPL')", timeout=5000)
            page.wait_for_selector("button:has-text('TSLA')", timeout=5000)
            print("Confirmed Asset Switcher is now UNLOCKED with full ticker matrix!")

            ss_unlocked_assets = "D:\\Caynex\\minigames\\screenshot_asset_switcher_unlocked.png"
            page.screenshot(path=ss_unlocked_assets)
            print(f"Captured: {ss_unlocked_assets}")

            # --- STEP 4: WARP TO $100,000 (FLASH NEWS ALERTS) ---
            print("--- STEP 4: WARP TO $100,000 & NEWS ALERTS ---")
            page.click("text=DEV")
            page.wait_for_selector("text=WARP TO $100,000", timeout=5000)
            page.get_by_text("WARP TO $100,000", exact=True).click()
            time.sleep(0.5)
            page.click("text=CLOSE")

            # Wait for News Alert banner
            page.wait_for_selector("text=MACRO VOLATILITY ALERTS UNLOCKED", timeout=5000)
            print("Flashing Yellow Macro News Alert banner displayed!")

            ss_news = "D:\\Caynex\\minigames\\screenshot_macro_news_alert.png"
            page.screenshot(path=ss_news)
            print(f"Captured: {ss_news}")

            # --- STEP 5: WARP TO $1,000,000 (PHASE 2 TRADE CONSOLE) ---
            print("--- STEP 5: WARP TO $1,000,000 (PHASE 2 TRADE CONSOLE) ---")
            page.click("text=DEV")
            page.wait_for_selector("text=WARP TO $1,000,000", timeout=5000)
            page.get_by_text("WARP TO $1,000,000", exact=True).click()
            time.sleep(0.5)
            page.click("text=CLOSE")
            time.sleep(1)

            page.wait_for_selector("text=INSTITUTIONAL TRADE CONSOLE", timeout=5000)
            print("Phase 2 Trade Console mounted successfully!")

            ss_phase2 = "D:\\Caynex\\minigames\\screenshot_phase2_console.png"
            page.screenshot(path=ss_phase2)
            print(f"Captured: {ss_phase2}")

            # --- STEP 6: WARP TO $10,000,000 (PHASE 3 BOT STUDIO) ---
            print("--- STEP 6: WARP TO $10,000,000 (PHASE 3 BOT STUDIO) ---")
            page.click("text=DEV")
            page.wait_for_selector("text=WARP TO $10,000,000", timeout=5000)
            page.get_by_text("WARP TO $10,000,000", exact=True).click()
            time.sleep(0.5)
            page.click("text=CLOSE")
            time.sleep(1)

            page.wait_for_selector("text=AUTONOMOUS QUANTITATIVE BOTS", timeout=5000)
            print("Phase 3 Bot Studio mounted successfully!")

            ss_phase3 = "D:\\Caynex\\minigames\\screenshot_phase3_bot_studio.png"
            page.screenshot(path=ss_phase3)
            print(f"Captured: {ss_phase3}")

            # --- STEP 7: WARP TO $100,000,000 (PHASE 4 PORTFOLIO) ---
            print("--- STEP 7: WARP TO $100,000,000 (PHASE 4 PORTFOLIO) ---")
            page.click("text=DEV")
            page.wait_for_selector("text=WARP TO $100,000,000", timeout=5000)
            page.get_by_text("WARP TO $100,000,000", exact=True).click()
            time.sleep(0.5)
            page.click("text=CLOSE")
            time.sleep(1)

            page.wait_for_selector("text=MACRO CAPITAL & SOVEREIGN DESK", timeout=5000)
            print("Phase 4 Portfolio Manager mounted successfully!")

            ss_phase4 = "D:\\Caynex\\minigames\\screenshot_phase4_portfolio.png"
            page.screenshot(path=ss_phase4)
            print(f"Captured: {ss_phase4}")

            # --- STEP 8: SAVE & RETURN TO MAIN MENU ---
            print("--- STEP 8: SAVE & RESUME ROUND-TRIP ---")
            page.click("button[title='Save & Return to Main Menu']")
            time.sleep(1)

            page.wait_for_selector("text=ACTIVE CAREER DETECTED", timeout=5000)
            ss_save = "D:\\Caynex\\minigames\\screenshot_start_screen_with_save.png"
            page.screenshot(path=ss_save)
            print(f"Captured: {ss_save}")

            # Click Resume Career
            print("Clicking RESUME CAREER...")
            page.locator("button:has-text('RESUME CAREER')").click()
            time.sleep(1)

            # Debug screenshot after clicking Resume Career
            ss_after_resume = "D:\\Caynex\\minigames\\screenshot_after_resume.png"
            page.screenshot(path=ss_after_resume)
            print(f"Captured after resume: {ss_after_resume}")

            body_after = page.locator("body").text_content()
            print(f"Body after resume (first 300 chars): {body_after[:300] if body_after else 'None'}")

            page.wait_for_selector("text=MACRO CAPITAL & SOVEREIGN DESK", timeout=5000)
            print("Successfully resumed career state back into Phase 4!")

            # Verify zero critical console errors
            critical_errors = [
                e for e in console_errors 
                if "favicon" not in e and "WebSocket connection" not in e
            ]
            print(f"Total console messages flagged as error: {len(console_errors)}")
            print(f"Critical console errors: {len(critical_errors)}")
            for err in critical_errors:
                print(f"  Console Error: {err}")
            assert len(critical_errors) == 0, f"Encountered {len(critical_errors)} critical console errors!"

            browser.close()
            print("==================================================")
            print("ALL PLAYWRIGHT E2E TESTS PASSED WITH 100% SUCCESS!")
            print("==================================================")

    finally:
        print("Terminating dev stack...")
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(backend_proc.pid)], capture_output=True)
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], capture_output=True)

if __name__ == "__main__":
    run_e2e_test()
