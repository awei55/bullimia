// Bullimia Data Manager
// Handles loading pre-packaged historical levels and on-demand yfinance ticker downloads

export class DataManager {
    constructor() {
        this.catalog = [];
        this.currentLevel = null;
    }

    async loadCatalog() {
        try {
            // Attempt API first, fallback to static JSON
            let res = await fetch('/api/levels').catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                this.catalog = data.levels || [];
            } else {
                res = await fetch('data/levels_catalog.json');
                this.catalog = await res.json();
            }
            return this.catalog;
        } catch (e) {
            console.warn('Could not load catalog remotely, using built-in fallback:', e);
            return [];
        }
    }

    async loadLevel(levelId) {
        try {
            let res = await fetch(`/api/level/${levelId}`).catch(() => null);
            if (res && res.ok) {
                this.currentLevel = await res.json();
                return this.currentLevel;
            }

            // Fallback to static data file
            res = await fetch(`data/level_${levelId}.json`);
            if (res && res.ok) {
                this.currentLevel = await res.json();
                return this.currentLevel;
            }
            throw new Error(`Level data for ${levelId} not found`);
        } catch (e) {
            console.error('Error loading level:', e);
            throw e;
        }
    }

    async fetchCustomTicker(ticker, period = '6mo', interval = '1d') {
        try {
            const url = `/api/fetch_ticker?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Failed to fetch ticker ${ticker}`);
            }
            const data = await res.json();
            this.currentLevel = data;
            return data;
        } catch (e) {
            console.error('Custom ticker fetch error:', e);
            throw e;
        }
    }
}
