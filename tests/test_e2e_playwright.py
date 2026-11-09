import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def run_e2e_test():
    print("1. Starting Backend Server on port 8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "backend/server.py"],
        cwd="D:\\Caynex\\minigames",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    print("2. Starting Vite Dev Server on port 5173...")
    frontend_proc = subprocess.Popen(
        ["cmd.exe", "/c", "npm run dev"],
        cwd="D:\\Caynex\\minigames",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Allow servers to start
    time.sleep(3)

    try:
        print("3. Launching Headless Playwright Browser...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            
            print("4. Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", wait_until="networkidle", timeout=15000)

            # Wait for Start Screen
            page.wait_for_selector("text=BULLIMIA", timeout=10000)
            print("Start Screen mounted successfully!")
            
            # Screenshot 1: Start Screen
            ss_start = "D:\\Caynex\\minigames\\screenshot_start_screen.png"
            page.screenshot(path=ss_start)
            print(f"Captured Start Screen: {ss_start}")

            # Click Start New Career
            print("5. Clicking Start New Career...")
            page.click("text=START NEW CAREER")
            time.sleep(1)

            # Wait for canvas & HUD
            page.wait_for_selector("canvas", timeout=10000)
            page.wait_for_selector("h1", timeout=5000)
            print("Chart Autoscroller mounted successfully!")

            # Open Dev Console
            print("6. Opening Dev Console...")
            page.click("text=DEV")
            page.wait_for_selector("text=DEV CONSOLE // PHASE & BALANCE WARPER", timeout=5000)

            # Warp to 10M (Phase 3 Bot Studio)
            print("7. Warping to $10,000,000 (Phase 3)...")
            page.click("text=WARP TO $10,000,000")
            time.sleep(0.5)
            page.click("text=CLOSE")

            time.sleep(1)
            # Verify Bot Studio View
            page.wait_for_selector("text=AUTONOMOUS QUANTITATIVE BOTS", timeout=5000)
            ss_phase3 = "D:\\Caynex\\minigames\\screenshot_phase3_bot_studio.png"
            page.screenshot(path=ss_phase3)
            print(f"Captured Phase 3 Bot Studio: {ss_phase3}")

            # Open Dev Console again and warp to 100M (Phase 4 Portfolio Manager)
            print("8. Warping to $100,000,000 (Phase 4)...")
            page.click("text=DEV")
            page.wait_for_selector("text=WARP TO $100,000,000", timeout=5000)
            page.click("text=WARP TO $100,000,000")
            time.sleep(0.5)
            page.click("text=CLOSE")

            time.sleep(1)
            # Verify Portfolio Manager View
            page.wait_for_selector("text=MACRO CAPITAL & SOVEREIGN DESK", timeout=5000)
            ss_phase4 = "D:\\Caynex\\minigames\\screenshot_phase4_portfolio.png"
            page.screenshot(path=ss_phase4)
            print(f"Captured Phase 4 Portfolio Manager: {ss_phase4}")

            # Return to Home / Menu
            print("9. Returning to Main Menu...")
            page.click("button[title='Save & Return to Main Menu']")
            time.sleep(1)

            # Verify Start Screen displays saved career
            page.wait_for_selector("text=ACTIVE CAREER DETECTED", timeout=5000)
            ss_resumed = "D:\\Caynex\\minigames\\screenshot_start_screen_with_save.png"
            page.screenshot(path=ss_resumed)
            print(f"Captured Start Screen with Save State: {ss_resumed}")

            # Click Resume Career
            print("10. Clicking Resume Career...")
            page.click("text=RESUME CAREER")
            time.sleep(1)

            # Verify it loads back into the Phase 4 Portfolio Manager!
            page.wait_for_selector("text=MACRO CAPITAL & SOVEREIGN DESK", timeout=5000)
            print("Successfully resumed into Phase 4 Portfolio Manager!")

            # Verify Console Errors
            print(f"Console errors: {len(console_errors)}")
            for err in console_errors:
                print(f"  Console Error: {err}")
            assert len(console_errors) == 0

            browser.close()
            print("Full UX & Save State E2E Verification Complete!")

    finally:
        print("Terminating test processes...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    run_e2e_test()
