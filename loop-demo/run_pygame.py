import os
import sys
import json
import math
import random
import pygame

# Initialize Pygame & Mixer
pygame.init()
pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)

WIDTH, HEIGHT = 1280, 720
FPS = 60

# Palette
BG_DARK = (6, 9, 19)
SKYLINE_FAR = (15, 26, 48)
SKYLINE_MID = (22, 35, 59)
GREEN_BULL = (0, 230, 118)
RED_BEAR = (255, 23, 68)
GOLD_TEXT = (255, 215, 0)
CYAN_ACCENT = (0, 229, 255)
WHITE = (240, 244, 248)
MUTED = (138, 153, 173)

class SoundFX:
    def __init__(self):
        self.sounds = {}
        try:
            self.generate_sounds()
        except Exception as e:
            print(f"Audio synth notice: {e}")

    def generate_sounds(self):
        # Generate procedural sounds in numpy/pygame array if possible, or graceful fallback
        try:
            import numpy as np
            # Sound 1: Bull flip (ascending chime)
            duration = 0.2
            sr = 44100
            t = np.linspace(0, duration, int(sr * duration), False)
            freq = np.linspace(220, 660, len(t))
            wave = (np.sin(2 * np.pi * freq * t) * 32767 * 0.3 * np.exp(-t * 8)).astype(np.int16)
            wave_stereo = np.column_stack((wave, wave))
            self.sounds['bull'] = pygame.sndarray.make_sound(wave_stereo)

            # Sound 2: Bear flip (descending drop)
            freq_bear = np.linspace(440, 80, len(t))
            wave_bear = (np.sin(2 * np.pi * freq_bear * t) * 32767 * 0.35 * np.exp(-t * 6)).astype(np.int16)
            wave_bear_stereo = np.column_stack((wave_bear, wave_bear))
            self.sounds['bear'] = pygame.sndarray.make_sound(wave_bear_stereo)

            # Sound 3: Cash register chime
            duration_c = 0.35
            tc = np.linspace(0, duration_c, int(sr * duration_c), False)
            wave_cash = (np.sin(2 * np.pi * 1800 * tc) + np.sin(2 * np.pi * 2400 * tc)) * 0.5
            wave_cash = (wave_cash * 32767 * 0.25 * np.exp(-tc * 10)).astype(np.int16)
            self.sounds['cash'] = pygame.sndarray.make_sound(np.column_stack((wave_cash, wave_cash)))

            # Sound 4: Loss thud
            tl = np.linspace(0, 0.3, int(sr * 0.3), False)
            wave_loss = (np.sin(2 * np.pi * 90 * tl) * 32767 * 0.4 * np.exp(-tl * 9)).astype(np.int16)
            self.sounds['loss'] = pygame.sndarray.make_sound(np.column_stack((wave_loss, wave_loss)))
        except Exception:
            pass

    def play(self, name):
        if name in self.sounds:
            self.sounds[name].play()

class Particle:
    def __init__(self, x, y, p_type='spark', color=GREEN_BULL):
        self.x = x
        self.y = y
        self.type = p_type
        self.color = color
        self.size = random.uniform(2, 5) if p_type != 'coin' else random.uniform(5, 8)
        angle = random.uniform(0, math.pi * 2)
        speed = random.uniform(60, 200)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed - 60
        self.gravity = 250 if p_type == 'coin' else 120
        self.life = random.uniform(0.6, 1.2)
        self.max_life = self.life

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.vy += self.gravity * dt
        self.life -= dt

    def draw(self, screen, cam_x, cam_y):
        if self.life <= 0: return
        sx = int(self.x - cam_x)
        sy = int(self.y - cam_y)
        alpha_factor = max(0.0, self.life / self.max_life)
        if self.type == 'coin':
            pygame.draw.circle(screen, GOLD_TEXT, (sx, sy), int(self.size))
            pygame.draw.circle(screen, (180, 140, 0), (sx, sy), int(self.size), 1)
        else:
            pygame.draw.circle(screen, self.color, (sx, sy), max(1, int(self.size * alpha_factor)))

class BullimiaPygame:
    def __init__(self):
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Bullimia - 2D Candlestick Trading Autoscroller")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("consolas", 18, bold=True)
        self.font_large = pygame.font.SysFont("consolas", 28, bold=True)
        self.font_title = pygame.font.SysFont("impact", 48)
        self.sfx = SoundFX()

        self.candle_w = 64
        self.candle_gap = 20
        self.step_x = self.candle_w + self.candle_gap

        self.particles = []
        self.floating_texts = []
        self.completed_trades = []
        self.load_level("NVDA")

    def load_level(self, level_id, preserve_career=True):
        # Seamless asset switch: close existing position if open
        if preserve_career and hasattr(self, 'position') and self.position.get("direction") != "FLAT":
            try:
                _, current_price, current_candle = self.get_surface_y_and_price(self.char_x)
                spread = current_candle.get("spread", 0.05)
                self.flip_position(1, close_only=True)
            except Exception:
                pass

        path = os.path.join(os.path.dirname(__file__), "data", f"level_{level_id}.json")
        if not os.path.exists(path):
            path = os.path.join(os.path.dirname(__file__), "data", "level_NVDA.json")
        
        with open(path, "r", encoding="utf-8") as f:
            self.level_data = json.load(f)

        self.candles = self.level_data.get("candles", [])
        total_candles = len(self.candles)

        # 1. Random Interesting Epoch Drop
        min_start = min(20, int(total_candles * 0.1))
        max_start = max(min_start, total_candles - 80)
        self.start_idx = random.randint(min_start, max_start) if total_candles > 80 else 0

        # 2. Volatility-Calibrated Logarithmic Scaling (Cures flat curves!)
        self.anchor_price = max(0.01, self.candles[self.start_idx]["open"])
        self.anchor_y = 480
        avg_atr = self.level_data.get("avg_atr_pct", 0.028)
        self.scale_log = max(800.0, min(3200.0, 48.0 / max(0.008, avg_atr)))

        # State
        self.char_x = self.start_idx * self.step_x + 100
        self.char_y = 300
        self.char_speed = 140
        self.is_bull = True
        
        # Charging
        self.is_space_down = False
        self.charge_start_time = 0
        self.charge_lots = 1
        self.charge_progress = 0.0

        # Trading (preserves accumulated career balance on seamless switch)
        if not preserve_career or not hasattr(self, 'cash'):
            self.cash = 10000.0
            self.equity = 10000.0
            self.completed_trades = []

        self.unrealized_pnl = 0.0
        start_candle = self.candles[self.start_idx]
        self.position = {
            "direction": "LONG",
            "lots": 1,
            "entry_price": start_candle["open"] + start_candle["spread"] * 0.5,
            "entry_x": self.char_x
        }
        self.commission_per_lot = 1.0
        self.cash -= self.commission_per_lot
        self.is_margin_called = False
        self.is_millionaire = False
        self.is_game_over = False

        # Camera
        self.cam_x = self.char_x - WIDTH * 0.32
        self.cam_y = self.char_y - HEIGHT * 0.5

    def price_to_y(self, p):
        p_safe = max(0.001, p)
        return self.anchor_y - math.log(p_safe / self.anchor_price) * self.scale_log

    def get_candle_at_x(self, x):
        idx = int((x - 100) / self.step_x)
        idx = max(0, min(len(self.candles) - 1, idx))
        return idx, self.candles[idx]

    def get_surface_y_and_price(self, x):
        idx, c = self.get_candle_at_x(x)
        next_c = self.candles[min(len(self.candles) - 1, idx + 1)]
        rel_x = (x - (idx * self.step_x + 100)) / self.step_x
        progress = max(0.0, min(1.0, rel_x))

        # Intraday simulated price
        if c["close"] >= c["open"]:
            price = c["open"] + (c["close"] - c["open"]) * progress
            y_curr = self.price_to_y(c["close"])
            y_next = self.price_to_y(next_c["close"])
        else:
            price = c["open"] + (c["close"] - c["open"]) * progress
            y_curr = self.price_to_y(c["open"])
            y_next = self.price_to_y(next_c["open"])

        if not self.is_bull:
            # Bear runs on underside
            y_curr = self.price_to_y(min(c["open"], c["close"]))
            y_next = self.price_to_y(min(next_c["open"], next_c["close"]))

        surface_y = y_curr + (y_next - y_curr) * progress
        return surface_y, price, c

    def flip_position(self, lots, close_only=False):
        idx, c = self.get_candle_at_x(self.char_x)
        _, current_price, _ = self.get_surface_y_and_price(self.char_x)
        spread = c.get("spread", 0.05)
        half_spread = spread * 0.5

        if self.position["direction"] == "LONG":
            # Close Long at Bid
            exit_bid = max(0.01, current_price - half_spread)
            pnl = (exit_bid - self.position["entry_price"]) * self.position["lots"]
            comm = self.commission_per_lot * self.position["lots"]
            net = pnl - comm
            self.cash += net

            # Record MT5 Trade
            self.completed_trades.append({
                "entry_x": self.position.get("entry_x", self.char_x),
                "exit_x": self.char_x,
                "entry_price": self.position["entry_price"],
                "exit_price": exit_bid,
                "pnl": net,
                "is_win": net > 0,
                "lots": self.position["lots"]
            })
            if len(self.completed_trades) > 30: self.completed_trades.pop(0)

            self.is_bull = False
            self.sfx.play('bear')
            self.on_trade_closed(net)

            if not close_only:
                # Open Short at Bid
                entry_bid = exit_bid
                self.cash -= self.commission_per_lot * lots
                self.position = {"direction": "SHORT", "lots": lots, "entry_price": entry_bid, "entry_x": self.char_x}
            else:
                self.position = {"direction": "FLAT", "lots": 0, "entry_price": 0, "entry_x": self.char_x}

        elif self.position["direction"] == "SHORT":
            # Close Short at Ask
            exit_ask = current_price + half_spread
            pnl = (self.position["entry_price"] - exit_ask) * self.position["lots"]
            comm = self.commission_per_lot * self.position["lots"]
            net = pnl - comm
            self.cash += net

            # Record MT5 Trade
            self.completed_trades.append({
                "entry_x": self.position.get("entry_x", self.char_x),
                "exit_x": self.char_x,
                "entry_price": self.position["entry_price"],
                "exit_price": exit_ask,
                "pnl": net,
                "is_win": net > 0,
                "lots": self.position["lots"]
            })
            if len(self.completed_trades) > 30: self.completed_trades.pop(0)

            self.is_bull = True
            self.sfx.play('bull')
            self.on_trade_closed(net)

            if not close_only:
                # Open Long at Ask
                entry_ask = exit_ask
                self.cash -= self.commission_per_lot * lots
                self.position = {"direction": "LONG", "lots": lots, "entry_price": entry_ask, "entry_x": self.char_x}
            else:
                self.position = {"direction": "FLAT", "lots": 0, "entry_price": 0, "entry_x": self.char_x}

    def on_trade_closed(self, net_pnl):
        if net_pnl > 0:
            self.sfx.play('cash')
            for _ in range(15):
                self.particles.append(Particle(self.char_x, self.char_y, 'coin'))
            self.floating_texts.append({"x": self.char_x, "y": self.char_y - 25, "text": f"+${net_pnl:.2f}", "color": GREEN_BULL, "life": 1.5})
        else:
            self.sfx.play('loss')
            for _ in range(12):
                self.particles.append(Particle(self.char_x, self.char_y, 'spark', RED_BEAR))
            self.floating_texts.append({"x": self.char_x, "y": self.char_y - 25, "text": f"-${abs(net_pnl):.2f}", "color": RED_BEAR, "life": 1.5})

    def run(self):
        running = True
        while running:
            dt = self.clock.tick(FPS) / 1000.0
            now = pygame.time.get_ticks()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE and not self.is_game_over:
                        if not self.is_space_down:
                            self.is_space_down = True
                            self.charge_start_time = now
                            self.charge_lots = 1
                            self.charge_progress = 0.0
                    elif event.key == pygame.K_r:
                        self.load_level(self.level_data["id"], preserve_career=False)
                    elif event.key == pygame.K_t:
                        # Drop into new random historical epoch
                        self.load_level(self.level_data["id"], preserve_career=True)
                    elif event.key in (pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5, pygame.K_6, pygame.K_7, pygame.K_8):
                        assets = ["NVDA", "TSLA", "BTC-USD", "SPY", "GME", "AAPL", "AMD", "QQQ"]
                        key_idx = event.key - pygame.K_1
                        if key_idx < len(assets):
                            self.load_level(assets[key_idx], preserve_career=True)
                elif event.type == pygame.KEYUP:
                    if event.key == pygame.K_SPACE and self.is_space_down and not self.is_game_over:
                        self.is_space_down = False
                        self.flip_position(self.charge_lots)
                        self.charge_lots = 1
                        self.charge_progress = 0.0

            # Update Spacebar hold charging
            if self.is_space_down and not self.is_game_over:
                hold_ms = now - self.charge_start_time
                self.charge_progress = min(1.0, hold_ms / 2200.0)
                self.charge_lots = min(100, max(1, 1 + int(99 * (self.charge_progress ** 1.3))))

            if not self.is_game_over:
                self.char_x += self.char_speed * dt
                target_y, current_price, current_candle = self.get_surface_y_and_price(self.char_x)
                self.char_y += (target_y - self.char_y) * (1 - math.exp(-14 * dt))

                # Mark to market
                spread = current_candle.get("spread", 0.05)
                half_spread = spread * 0.5
                if self.position["direction"] == "LONG":
                    self.unrealized_pnl = (max(0.01, current_price - half_spread) - self.position["entry_price"]) * self.position["lots"]
                else:
                    self.unrealized_pnl = (self.position["entry_price"] - (current_price + half_spread)) * self.position["lots"]

                self.equity = self.cash + self.unrealized_pnl

                if self.equity <= 0:
                    self.is_game_over = True
                    self.is_margin_called = True
                    self.sfx.play('loss')
                elif self.equity >= 1000000:
                    self.is_game_over = True
                    self.is_millionaire = True
                    self.sfx.play('cash')

            # Camera follow
            self.cam_x += (self.char_x - WIDTH * 0.32 - self.cam_x) * (1 - math.exp(-8 * dt))
            self.cam_y += (self.char_y - HEIGHT * 0.5 - self.cam_y) * (1 - math.exp(-6 * dt))

            # Update particles
            for p in self.particles[:]:
                p.update(dt)
                if p.life <= 0: self.particles.remove(p)

            for t in self.floating_texts[:]:
                t["y"] -= 30 * dt
                t["life"] -= dt
                if t["life"] <= 0: self.floating_texts.remove(t)

            # --- RENDER ---
            self.screen.fill(BG_DARK)

            # Skyline Parallax
            p_far = int(self.cam_x * 0.1) % 160
            for bx in range(-160, WIDTH + 160, 140):
                pygame.draw.rect(self.screen, SKYLINE_FAR, (bx - p_far, HEIGHT - 200, 100, 200))
            p_mid = int(self.cam_x * 0.25) % 200
            for bx in range(-200, WIDTH + 200, 180):
                pygame.draw.rect(self.screen, SKYLINE_MID, (bx - p_mid, HEIGHT - 130, 120, 130))

            # --- Candlesticks (Fog of War: Past candles only) ---
            start_idx = max(0, int((self.cam_x - 100) / self.step_x))
            current_idx = max(0, min(len(self.candles) - 1, int((self.char_x - 100) / self.step_x)))

            for i in range(start_idx, current_idx + 1):
                c = self.candles[i]
                candle_start_x = i * self.step_x + 100
                if candle_start_x > self.char_x:
                    continue

                cx = int(candle_start_x - self.cam_x)
                center_x = cx + self.candle_w // 2
                y_high = int(self.price_to_y(c["high"]) - self.cam_y)
                y_low = int(self.price_to_y(c["low"]) - self.cam_y)
                y_open = int(self.price_to_y(c["open"]) - self.cam_y)
                y_close = int(self.price_to_y(c["close"]) - self.cam_y)

                is_green = c["close"] >= c["open"]
                color = GREEN_BULL if is_green else RED_BEAR

                # Clip body width if currently traversing this candle
                vis_w = min(self.candle_w, max(4, int(self.char_x - candle_start_x)))

                # Wick (only if center is passed)
                if candle_start_x + self.candle_w // 2 <= self.char_x:
                    pygame.draw.line(self.screen, color, (center_x, y_high), (center_x, y_low), 2)

                # Body
                body_top = min(y_open, y_close)
                body_h = max(4, abs(y_close - y_open))
                pygame.draw.rect(self.screen, color, (cx, body_top, vis_w, body_h), border_radius=2)

            # --- MetaTrader 5 (MT5) Style Trade Lines (Green=Win, Red=Loss) ---
            for t in self.completed_trades:
                x1 = int(t["entry_x"] - self.cam_x)
                y1 = int(self.price_to_y(t["entry_price"]) - self.cam_y)
                x2 = int(t["exit_x"] - self.cam_x)
                y2 = int(self.price_to_y(t["exit_price"]) - self.cam_y)
                col = GREEN_BULL if t["is_win"] else RED_BEAR

                if -150 <= max(x1, x2) and min(x1, x2) <= WIDTH + 150:
                    pygame.draw.line(self.screen, col, (x1, y1), (x2, y2), 2)
                    pygame.draw.circle(self.screen, col, (x1, y1), 3)
                    pygame.draw.circle(self.screen, col, (x2, y2), 4)

                    mx = (x1 + x2) // 2
                    my = (y1 + y2) // 2
                    pnl_text = f"{'+' if t['pnl'] >= 0 else ''}${t['pnl']:.2f}"
                    pnl_s = self.font.render(pnl_text, True, col)
                    pygame.draw.rect(self.screen, (6, 12, 24), (mx - pnl_s.get_width()//2 - 4, my - 9, pnl_s.get_width() + 8, 18), border_radius=4)
                    pygame.draw.rect(self.screen, col, (mx - pnl_s.get_width()//2 - 4, my - 9, pnl_s.get_width() + 8, 18), 1, border_radius=4)
                    self.screen.blit(pnl_s, (mx - pnl_s.get_width()//2, my - 7))

            # --- Monte Carlo Volatility Surface Forecast Paths ---
            mc_start_x = int(self.char_x - self.cam_x) + 6
            mc_start_y = int(self.price_to_y(current_price) - self.cam_y)
            t_sec = now / 1000.0

            # Draw 15 cycling stochastic ghost trajectories
            for k in range(15):
                path_phase = k * 0.42
                wave = math.sin(t_sec * 1.5 + path_phase)
                alpha_val = int(35 + 25 * wave)
                surf_line = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)

                points = [(mc_start_x, mc_start_y)]
                curr_pt_y = mc_start_y
                for j in range(1, 14):
                    px = mc_start_x + j * 44
                    step_drift = math.sin(k * 1.7 + j * 0.6 + t_sec * 2) * (j * 2.8)
                    curr_pt_y += step_drift
                    points.append((px, curr_pt_y))

                col = (0, 229, 255, alpha_val) if k % 2 == 0 else (255, 215, 0, int(alpha_val * 0.8))
                if len(points) > 1:
                    pygame.draw.lines(surf_line, col, False, points, 1)
                self.screen.blit(surf_line, (0, 0))

            # --- Glowing Current Price Line with Bid-Ask Spread Thickness ---
            beam_start_x = int(self.char_x - self.cam_x) + 4
            beam_end_x = WIDTH
            y_mid = int(self.price_to_y(current_price) - self.cam_y)
            y_ask = int(self.price_to_y(current_price + half_spread) - self.cam_y)
            y_bid = int(self.price_to_y(max(0.01, current_price - half_spread)) - self.cam_y)

            band_h = max(6, abs(y_bid - y_ask))
            band_top = y_mid - band_h // 2

            # Translucent spread corridor
            corridor_surf = pygame.Surface((beam_end_x - beam_start_x, band_h), pygame.SRCALPHA)
            corridor_surf.fill((0, 229, 255, 30))
            self.screen.blit(corridor_surf, (beam_start_x, band_top))

            # Upper Ask Rail (Green)
            pygame.draw.line(self.screen, (0, 255, 136), (beam_start_x, band_top), (beam_end_x, band_top), 2)
            # Lower Bid Rail (Red)
            pygame.draw.line(self.screen, (255, 23, 68), (beam_start_x, band_top + band_h), (beam_end_x, band_top + band_h), 2)
            # Center Mid Line (Cyan)
            pygame.draw.line(self.screen, CYAN_ACCENT, (beam_start_x, y_mid), (beam_end_x, y_mid), 1)

            # Spread Badge at beam origin
            spread_tag = self.font.render(f"${current_price:.2f} (SPD: ${spread:.2f})", True, CYAN_ACCENT)
            pygame.draw.rect(self.screen, (6, 12, 24), (beam_start_x + 18, y_mid - 12, spread_tag.get_width() + 12, 24), border_radius=4)
            pygame.draw.rect(self.screen, CYAN_ACCENT, (beam_start_x + 18, y_mid - 12, spread_tag.get_width() + 12, 24), 1, border_radius=4)
            self.screen.blit(spread_tag, (beam_start_x + 24, y_mid - 9))

            # Character
            draw_x = int(self.char_x - self.cam_x)
            draw_y = int(self.char_y - self.cam_y)
            if self.is_space_down:
                jitter = (self.charge_progress * 8)
                draw_x += random.randint(int(-jitter), int(jitter))
                draw_y += random.randint(int(-jitter), int(jitter))

            if self.is_bull:
                # Bull (Gold)
                pygame.draw.ellipse(self.screen, (198, 125, 10), (draw_x - 20, draw_y - 25, 40, 24))
                pygame.draw.circle(self.screen, (255, 234, 0), (draw_x + 15, draw_y - 25), 6) # Horn
                pygame.draw.circle(self.screen, GREEN_BULL, (draw_x + 12, draw_y - 18), 3) # Eye
            else:
                # Bear (Dark Charcoal Inverted)
                pygame.draw.ellipse(self.screen, (44, 52, 64), (draw_x - 20, draw_y + 2, 40, 24))
                pygame.draw.rect(self.screen, RED_BEAR, (draw_x + 8, draw_y + 8, 10, 4)) # Shades

            # Overhead lots badge when holding space
            if self.is_space_down:
                badge_text = self.font.render(f"LOTS: {self.charge_lots}", True, GOLD_TEXT)
                pygame.draw.rect(self.screen, (10, 16, 28), (draw_x - 45, draw_y - 55, 90, 24), border_radius=6)
                pygame.draw.rect(self.screen, GOLD_TEXT, (draw_x - 45, draw_y - 55, 90, 24), 1, border_radius=6)
                self.screen.blit(badge_text, (draw_x - 38, draw_y - 52))

            # Particles & Floating Texts
            for p in self.particles:
                p.draw(self.screen, self.cam_x, self.cam_y)

            for t in self.floating_texts:
                surf = self.font.render(t["text"], True, t["color"])
                self.screen.blit(surf, (int(t["x"] - self.cam_x - surf.get_width() // 2), int(t["y"] - self.cam_y)))

            # HUD Bar at top
            pygame.draw.rect(self.screen, (11, 19, 43), (16, 12, WIDTH - 32, 54), border_radius=10)
            pygame.draw.rect(self.screen, CYAN_ACCENT, (16, 12, WIDTH - 32, 54), 1, border_radius=10)

            title_s = self.font.render(f"{self.level_data['ticker']} • {current_candle['date']} (Candle {current_idx + 1})", True, CYAN_ACCENT)
            self.screen.blit(title_s, (32, 28))

            pos_s = self.font.render(f"POS: {self.position['direction']} {self.position['lots']}L @ ${self.position['entry_price']:.2f}", True, GREEN_BULL if self.is_bull else RED_BEAR)
            self.screen.blit(pos_s, (450, 28))

            eq_color = GREEN_BULL if self.equity >= 10000 else RED_BEAR
            eq_s = self.font_large.render(f"${self.equity:,.2f}", True, eq_color)
            self.screen.blit(eq_s, (WIDTH - eq_s.get_width() - 32, 24))

            # Game Over Overlays
            if self.is_margin_called:
                overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                overlay.fill((10, 0, 0, 200))
                self.screen.blit(overlay, (0, 0))
                msg = self.font_title.render("🚨 MARGIN CALL! ACCOUNT LIQUIDATED! 🚨", True, RED_BEAR)
                sub = self.font.render("Press 'R' to Restart or Keys 1-4 to Switch Levels", True, WHITE)
                self.screen.blit(msg, (WIDTH // 2 - msg.get_width() // 2, HEIGHT // 2 - 40))
                self.screen.blit(sub, (WIDTH // 2 - sub.get_width() // 2, HEIGHT // 2 + 30))
            elif self.is_millionaire:
                overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                overlay.fill((0, 20, 10, 200))
                self.screen.blit(overlay, (0, 0))
                msg = self.font_title.render("🏆 CONGRATULATIONS! WALL STREET MILLIONAIRE! 🍾", True, GOLD_TEXT)
                sub = self.font.render("Press 'R' to Play Again", True, WHITE)
                self.screen.blit(msg, (WIDTH // 2 - msg.get_width() // 2, HEIGHT // 2 - 40))
                self.screen.blit(sub, (WIDTH // 2 - sub.get_width() // 2, HEIGHT // 2 + 30))

            pygame.display.flip()

        pygame.quit()

if __name__ == "__main__":
    game = BullimiaPygame()
    game.run()
