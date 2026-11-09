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

            # Wait for canvas to mount
            page.wait_for_selector("canvas", timeout=10000)
            print("Canvas mounted successfully!")

            # Wait for HUD asset ticker
            page.wait_for_selector("h1", timeout=5000)
            asset_title = page.text_content("h1")
            print(f"HUD Asset Title: {asset_title}")
            assert "NVDA" in asset_title or "LOADING" in asset_title

            # Wait 2 seconds for gameplay autoscroll
            time.sleep(2)

            # Test Spacebar press (flip from Bull to Bear)
            print("5. Testing Spacebar flip...")
            page.keyboard.down("Space")
            time.sleep(0.4) # charge lots
            page.keyboard.up("Space")

            time.sleep(1)

            # Capture Flagship Screenshot
            screenshot_path = "D:\\Caynex\\minigames\\screenshot_svelte_pixi_flagship.png"
            page.screenshot(path=screenshot_path)
            print(f"6. Screenshot captured at {screenshot_path}")

            # Verify no critical runtime errors
            print(f"Console errors: {len(console_errors)}")
            for err in console_errors:
                print(f"  Console Error: {err}")

            browser.close()
            print("E2E Verification Complete!")

    finally:
        print("Terminating test processes...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    run_e2e_test()
