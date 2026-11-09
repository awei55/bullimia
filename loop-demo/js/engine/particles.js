// Bullimia Particle FX System
// Handles running sparks, gold coins, dollar bills, lightning arcs, steam puffs, and fireworks

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.rotation += (p.vRot || 0) * dt;

            // Optional fade
            p.alpha = Math.max(0, p.life / p.maxLife);
        }

        // Update floating texts (P&L popups)
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.life -= dt;
            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            t.y += t.vy * dt;
            t.alpha = Math.min(1.0, t.life / 0.5);
        }
    }

    render(ctx, camera) {
        ctx.save();

        // 1. Render all particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            if (p.type === 'coin') {
                // Gold coin with 3D spin effect
                const scaleX = Math.cos(p.rotation * 2);
                ctx.scale(scaleX, 1);
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#FFA000';
                ctx.stroke();
                // Dollar sign on coin
                if (Math.abs(scaleX) > 0.4) {
                    ctx.fillStyle = '#B78103';
                    ctx.font = `bold ${p.size * 1.1}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', 0, 0);
                }
            } else if (p.type === 'dollar') {
                // Green floating dollar bill
                ctx.fillStyle = '#00E676';
                ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
                ctx.strokeStyle = '#00B0FF';
                ctx.lineWidth = 1;
                ctx.strokeRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
                ctx.fillStyle = '#003300';
                ctx.font = `bold ${p.size * 0.8}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 0);
            } else if (p.type === 'spark') {
                // Glowing spark
                ctx.fillStyle = p.color || '#00E676';
                ctx.shadowColor = p.color || '#00E676';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'steam') {
                // Steam/smoke puff
                ctx.fillStyle = `rgba(220, 230, 240, ${p.alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (2 - p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'confetti') {
                // Multi-colored confetti strip
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
            } else if (p.type === 'firework') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 2. Render floating P&L text badges
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.font = `900 ${t.fontSize}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Glow & Shadow
            ctx.shadowColor = t.glowColor;
            ctx.shadowBlur = 12;

            // Background pill
            const textWidth = ctx.measureText(t.text).width;
            ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
            ctx.beginPath();
            ctx.roundRect(t.x - textWidth / 2 - 10, t.y - t.fontSize / 2 - 6, textWidth + 20, t.fontSize + 12, 8);
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = t.color;
            ctx.stroke();

            // Text
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        ctx.restore();
    }

    // --- Particle Spawn Helpers ---

    spawnRunSparks(x, y, isBull) {
        const count = 2;
        const color = isBull ? '#00E676' : '#FF1744';
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'spark',
                x: x + (Math.random() - 0.5) * 10,
                y: y + (isBull ? 8 : -8),
                vx: -60 - Math.random() * 60,
                vy: (isBull ? -1 : 1) * (20 + Math.random() * 40),
                gravity: isBull ? 120 : -120,
                rotation: 0,
                vRot: 0,
                size: 2 + Math.random() * 2.5,
                color: color,
                life: 0.35 + Math.random() * 0.2,
                maxLife: 0.55
            });
        }
    }

    spawnSteam(x, y, direction = 1) {
        this.particles.push({
            type: 'steam',
            x: x,
            y: y,
            vx: direction * (40 + Math.random() * 40),
            vy: -15 + (Math.random() - 0.5) * 20,
            gravity: -10,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 3,
            size: 4 + Math.random() * 5,
            life: 0.45,
            maxLife: 0.45
        });
    }

    spawnProfitBurst(x, y, amount) {
        const coinCount = Math.min(30, 8 + Math.floor(Math.abs(amount) / 200));
        for (let i = 0; i < coinCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 220;
            this.particles.push({
                type: 'coin',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                gravity: 350,
                rotation: Math.random() * Math.PI,
                vRot: 8 + Math.random() * 12,
                size: 6 + Math.random() * 4,
                life: 1.2 + Math.random() * 0.6,
                maxLife: 1.8
            });
        }

        // Also add floating dollar bills
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                type: 'dollar',
                x: x + (Math.random() - 0.5) * 30,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: -80 - Math.random() * 100,
                gravity: 80,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 4,
                size: 9 + Math.random() * 4,
                life: 1.8 + Math.random() * 0.5,
                maxLife: 2.3
            });
        }
    }

    spawnLossBurst(x, y, amount) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 160;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 200,
                rotation: 0,
                vRot: 0,
                size: 3 + Math.random() * 4,
                color: '#FF1744',
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0
            });
        }
    }

    spawnFloatingText(x, y, text, isProfit) {
        this.floatingTexts.push({
            x: x,
            y: y - 25,
            vy: -45,
            text: text,
            color: isProfit ? '#00E676' : '#FF1744',
            glowColor: isProfit ? 'rgba(0, 230, 118, 0.6)' : 'rgba(255, 23, 68, 0.6)',
            fontSize: isProfit ? 22 : 20,
            life: 1.6,
            maxLife: 1.6,
            alpha: 1.0
        });
    }

    spawnMillionaireFireworks(cx, cy) {
        const colors = ['#FFD700', '#00E676', '#00B0FF', '#FF4081', '#FFEA00', '#FFFFFF'];
        for (let b = 0; b < 6; b++) {
            const bx = cx + (Math.random() - 0.5) * 500;
            const by = cy - 100 - Math.random() * 300;
            const burstColor = colors[b % colors.length];

            for (let i = 0; i < 28; i++) {
                const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
                const speed = 100 + Math.random() * 200;
                this.particles.push({
                    type: 'firework',
                    x: bx,
                    y: by,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 90,
                    rotation: 0,
                    size: 3 + Math.random() * 3,
                    color: burstColor,
                    life: 1.2 + Math.random() * 0.6,
                    maxLife: 1.8
                });
            }
        }
    }
}
