// Bullimia Main Bootstrap Entry Point

import { DataManager } from './trading/data_manager.js';
import { HUD } from './ui/hud.js';
import { Minimap } from './ui/minimap.js';
import { MenuController } from './ui/menus.js';
import { GameEngine } from './engine/game.js';
import { audio } from './engine/audio.js';

window.addEventListener('DOMContentLoaded', async () => {
    const mainCanvas = document.getElementById('game-canvas');
    const miniCanvas = document.getElementById('minimap-canvas');

    const dataManager = new DataManager();
    const hud = new HUD();
    const minimap = new Minimap(miniCanvas);

    let gameEngine = null;

    // Menu callbacks
    const menu = new MenuController({
        onSelectLevel: async (levelId) => {
            try {
                const levelData = await dataManager.loadLevel(levelId);
                // Seamless asset switch: preserves career equity, closes open position, drops into random epoch!
                gameEngine.startLevel(levelData, null, true);
            } catch (e) {
                alert(`Could not load level ${levelId}: ${e.message}`);
            }
        },
        onRestartLevel: () => {
            if (dataManager.currentLevel) {
                gameEngine.startLevel(dataManager.currentLevel, null, false);
            }
        },
        onFetchCustom: async (ticker, period, interval) => {
            const levelData = await dataManager.fetchCustomTicker(ticker, period, interval);
            gameEngine.startLevel(levelData, null, true);
        }
    });

    // Initialize Game Engine
    gameEngine = new GameEngine(mainCanvas, minimap, hud, menu);
    window.gameEngine = gameEngine;
    window.focus();

    // Random Era Button
    const btnRandomEra = document.getElementById('btn-random-era');
    if (btnRandomEra) {
        btnRandomEra.addEventListener('click', () => {
            if (dataManager.currentLevel) {
                // Drop into brand new random historical epoch for current asset
                gameEngine.startLevel(dataManager.currentLevel, null, true);
            }
        });
    }

    // Audio & UI Controls
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            const isMuted = audio.toggleMute();
            btnMute.textContent = isMuted ? '🔇 MUTED' : '🔊 SFX ON';
            btnMute.classList.toggle('active', isMuted);
        });
    }

    const btnBgm = document.getElementById('btn-bgm');
    if (btnBgm) {
        btnBgm.addEventListener('click', () => {
            if (audio.bgmPlaying) {
                audio.stopBGM();
                btnBgm.textContent = '🎵 BGM: OFF';
                btnBgm.classList.remove('active');
            } else {
                audio.startBGM();
                btnBgm.textContent = '🎵 BGM: ON';
                btnBgm.classList.add('active');
            }
        });
    }

    const btnSelectLevel = document.getElementById('btn-select-level');
    if (btnSelectLevel) {
        btnSelectLevel.addEventListener('click', () => {
            menu.showLevelSelect();
        });
    }

    // Load initial catalog
    try {
        const catalog = await dataManager.loadCatalog();
        menu.populateLevels(catalog);

        // Auto-load GME_2021 or the first available level!
        const defaultLevelId = catalog.some(c => c.id === 'GME_2021') ? 'GME_2021' : (catalog[0] ? catalog[0].id : null);
        if (defaultLevelId) {
            const defaultLevel = await dataManager.loadLevel(defaultLevelId);
            gameEngine.startLevel(defaultLevel);
        } else {
            menu.showLevelSelect();
        }
    } catch (e) {
        console.error('Initialization error:', e);
        menu.showLevelSelect();
    }
});
