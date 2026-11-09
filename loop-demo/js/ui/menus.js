// Bullimia Menus & Modals Controller
// Manages Level Selector, Custom Ticker Fetcher, Instructions, Margin Call, and Millionaire victory

export class MenuController {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.dom = {
            levelModal: document.getElementById('modal-level-select'),
            levelList: document.getElementById('level-grid'),
            customTickerInput: document.getElementById('input-custom-ticker'),
            customPeriodSelect: document.getElementById('select-custom-period'),
            customIntervalSelect: document.getElementById('select-custom-interval'),
            btnFetchCustom: document.getElementById('btn-fetch-custom'),
            customStatus: document.getElementById('custom-status'),
            
            helpModal: document.getElementById('modal-help'),
            btnHelp: document.getElementById('btn-help'),
            btnCloseHelp: document.getElementById('btn-close-help'),

            marginModal: document.getElementById('modal-margin-call'),
            btnMarginRetry: document.getElementById('btn-margin-retry'),
            btnMarginLevels: document.getElementById('btn-margin-levels'),
            marginStats: document.getElementById('margin-stats'),

            millionaireModal: document.getElementById('modal-millionaire'),
            btnMilReplay: document.getElementById('btn-mil-replay'),
            btnMilLevels: document.getElementById('btn-mil-levels'),
            millionaireStats: document.getElementById('millionaire-stats'),

            levelCompleteModal: document.getElementById('modal-level-complete'),
            btnCompleteReplay: document.getElementById('btn-complete-replay'),
            btnCompleteLevels: document.getElementById('btn-complete-levels'),
            completeStats: document.getElementById('complete-stats')
        };

        this.initEvents();
    }

    initEvents() {
        // Custom Ticker Fetch
        if (this.dom.btnFetchCustom) {
            this.dom.btnFetchCustom.addEventListener('click', () => this.handleCustomFetch());
        }
        if (this.dom.customTickerInput) {
            this.dom.customTickerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleCustomFetch();
            });
        }

        // Help Modal
        if (this.dom.btnHelp) {
            this.dom.btnHelp.addEventListener('click', () => this.showModal('helpModal'));
        }
        if (this.dom.btnCloseHelp) {
            this.dom.btnCloseHelp.addEventListener('click', () => this.hideModal('helpModal'));
        }

        // Margin Call Buttons
        if (this.dom.btnMarginRetry) {
            this.dom.btnMarginRetry.addEventListener('click', () => {
                this.hideModal('marginModal');
                if (this.callbacks.onRestartLevel) this.callbacks.onRestartLevel();
            });
        }
        if (this.dom.btnMarginLevels) {
            this.dom.btnMarginLevels.addEventListener('click', () => {
                this.hideModal('marginModal');
                this.showLevelSelect();
            });
        }

        // Millionaire Buttons
        if (this.dom.btnMilReplay) {
            this.dom.btnMilReplay.addEventListener('click', () => {
                this.hideModal('millionaireModal');
                if (this.callbacks.onRestartLevel) this.callbacks.onRestartLevel();
            });
        }
        if (this.dom.btnMilLevels) {
            this.dom.btnMilLevels.addEventListener('click', () => {
                this.hideModal('millionaireModal');
                this.showLevelSelect();
            });
        }

        // Level Complete Buttons
        if (this.dom.btnCompleteReplay) {
            this.dom.btnCompleteReplay.addEventListener('click', () => {
                this.hideModal('levelCompleteModal');
                if (this.callbacks.onRestartLevel) this.callbacks.onRestartLevel();
            });
        }
        if (this.dom.btnCompleteLevels) {
            this.dom.btnCompleteLevels.addEventListener('click', () => {
                this.hideModal('levelCompleteModal');
                this.showLevelSelect();
            });
        }
    }

    showModal(modalName) {
        if (this.dom[modalName]) {
            this.dom[modalName].classList.add('active');
        }
    }

    hideModal(modalName) {
        if (this.dom[modalName]) {
            this.dom[modalName].classList.remove('active');
        }
    }

    hideAllModals() {
        ['levelModal', 'helpModal', 'marginModal', 'millionaireModal', 'levelCompleteModal'].forEach(m => {
            this.hideModal(m);
        });
    }

    populateLevels(catalog) {
        if (!this.dom.levelList) return;
        this.dom.levelList.innerHTML = '';

        catalog.forEach(lvl => {
            const card = document.createElement('div');
            card.className = 'level-card';
            card.innerHTML = `
                <div class="level-badge">${lvl.difficulty || 'Asset'}</div>
                <div class="level-ticker">${lvl.ticker}</div>
                <div class="level-name">${lvl.name}</div>
                <div class="level-period">📅 ${lvl.count} Historical Candles (${lvl.period_desc})</div>
                <p class="level-lore">${lvl.lore || ''}</p>
                <button class="btn-play-level">🎲 DROP INTO RANDOM ERA</button>
            `;

            card.querySelector('.btn-play-level').addEventListener('click', () => {
                this.hideModal('levelModal');
                if (this.callbacks.onSelectLevel) {
                    this.callbacks.onSelectLevel(lvl.id);
                }
            });

            this.dom.levelList.appendChild(card);
        });
    }

    showLevelSelect() {
        this.hideAllModals();
        this.showModal('levelModal');
    }

    async handleCustomFetch() {
        const ticker = (this.dom.customTickerInput.value || '').trim();
        if (!ticker) {
            this.setCustomStatus('Please enter a ticker symbol (e.g. AAPL, NVDA, COIN)', 'error');
            return;
        }

        const period = this.dom.customPeriodSelect ? this.dom.customPeriodSelect.value : '6mo';
        const interval = this.dom.customIntervalSelect ? this.dom.customIntervalSelect.value : '1d';

        this.setCustomStatus(`Downloading real data for ${ticker.toUpperCase()} from Yahoo Finance...`, 'info');
        this.dom.btnFetchCustom.disabled = true;

        try {
            if (this.callbacks.onFetchCustom) {
                await this.callbacks.onFetchCustom(ticker, period, interval);
                this.hideModal('levelModal');
                this.setCustomStatus('');
            }
        } catch (e) {
            this.setCustomStatus(`Failed: ${e.message}`, 'error');
        } finally {
            this.dom.btnFetchCustom.disabled = false;
        }
    }

    setCustomStatus(msg, type = 'info') {
        if (this.dom.customStatus) {
            this.dom.customStatus.textContent = msg;
            this.dom.customStatus.className = `custom-status ${type}`;
        }
    }

    showMarginCall(stats) {
        this.renderStatsHTML(this.dom.marginStats, stats);
        this.showModal('marginModal');
    }

    showMillionaire(stats) {
        this.renderStatsHTML(this.dom.millionaireStats, stats);
        this.showModal('millionaireModal');
    }

    showLevelComplete(stats) {
        this.renderStatsHTML(this.dom.completeStats, stats);
        this.showModal('levelCompleteModal');
    }

    renderStatsHTML(container, stats) {
        if (!container || !stats) return;

        const isProfit = stats.finalEquity >= stats.initialCapital;
        const colorClass = isProfit ? 'positive' : 'negative';

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-box">
                    <span class="stat-label">Final Equity</span>
                    <span class="stat-value ${colorClass}">$${stats.finalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Return</span>
                    <span class="stat-value ${colorClass}">${stats.totalReturnPct > 0 ? '+' : ''}${stats.totalReturnPct}%</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Total Trades</span>
                    <span class="stat-value">${stats.totalTrades}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Win Rate</span>
                    <span class="stat-value">${stats.winRate}% (${stats.winningTrades}W / ${stats.losingTrades}L)</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Peak Equity</span>
                    <span class="stat-value positive">$${stats.peakEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Best Trade</span>
                    <span class="stat-value positive">+$${stats.maxProfit.toFixed(2)}</span>
                </div>
            </div>
            ${stats.history && stats.history.length > 0 ? `
                <div class="trade-log-section">
                    <h4>Recent Trade Log</h4>
                    <div class="trade-log-list">
                        ${stats.history.map(t => `
                            <div class="trade-log-item ${t.isWin ? 'win' : 'loss'}">
                                <span>#${t.id} ${t.direction} ${t.lots}L</span>
                                <span>In: $${t.entryPrice.toFixed(2)} -> Out: $${t.exitPrice.toFixed(2)}</span>
                                <strong class="${t.isWin ? 'positive' : 'negative'}">${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }
}
