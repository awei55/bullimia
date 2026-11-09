// Bullimia Character Entity (Bull & Bear)
// Features procedural indie vector art, galloping run cycles, violent vibration, and floating order badge

export class Character {
    constructor() {
        this.x = 100;
        this.y = 300;
        this.targetY = 300;
        
        // State: true = BULL (Top/Long), false = BEAR (Underside/Short)
        this.isBull = true;
        
        // Autoscroll velocity (pixels per second)
        this.speedX = 140; // tuned for good arcade reading speed
        
        // Animation counters
        this.runCycle = 0;
        this.time = 0;
        
        // Charging & Vibration state
        this.isCharging = false;
        this.chargeProgress = 0.0; // 0.0 to 1.0
        this.currentLots = 1;
        this.jitterX = 0;
        this.jitterY = 0;

        // Visual dimensions
        this.width = 54;
        this.height = 36;
    }

    reset(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.targetY = startY;
        this.isBull = true;
        this.isCharging = false;
        this.chargeProgress = 0;
        this.currentLots = 1;
        this.jitterX = 0;
        this.jitterY = 0;
        this.runCycle = 0;
    }

    setCharging(isCharging, progress = 0, lots = 1) {
        this.isCharging = isCharging;
        this.chargeProgress = progress;
        this.currentLots = lots;
    }

    flip() {
        this.isBull = !this.isBull;
    }

    update(dt, world, particleSystem) {
        this.time += dt;
        
        // Advance autoscroller forward
        this.x += this.speedX * dt;
        
        // Query candlestick world for exact surface Y and price
        const worldState = world.getStateAtX(this.x, this.isBull);
        this.targetY = worldState.surfaceY;

        // Smoothly interpolate vertical position towards surface
        const lerpRate = 18.0;
        this.y += (this.targetY - this.y) * (1 - Math.exp(-lerpRate * dt));

        // Advance run animation
        this.runCycle += dt * 14;

        // Handle Vibration when holding space
        if (this.isCharging) {
            const intensity = 3.0 + this.chargeProgress * 12.0;
            this.jitterX = (Math.random() - 0.5) * intensity;
            this.jitterY = (Math.random() - 0.5) * intensity;

            // Spawn steam puff periodically
            if (Math.random() < 0.25) {
                const steamY = this.isBull ? this.y - 12 : this.y + 12;
                particleSystem.spawnSteam(this.x + 24, steamY, 1);
            }
        } else {
            this.jitterX = 0;
            this.jitterY = 0;
        }

        // Spawn hoof/claw sparks while running
        if (Math.random() < 0.35) {
            particleSystem.spawnRunSparks(this.x - 14, this.y, this.isBull);
        }

        return worldState;
    }

    render(ctx) {
        ctx.save();

        const drawX = this.x + this.jitterX;
        const drawY = this.y + this.jitterY;

        ctx.translate(drawX, drawY);

        if (!this.isBull) {
            // Flip upside-down for Bear running on underside
            ctx.scale(1, -1);
        }

        // Draw Character Sprite
        if (this.isBull) {
            this.drawBull(ctx);
        } else {
            this.drawBear(ctx);
        }

        // Draw electric lightning arcs when vibrating heavily
        if (this.isCharging && this.chargeProgress > 0.15) {
            this.drawLightningArcs(ctx);
        }

        ctx.restore();

        // Draw Floating Order Size Badge Overhead (rendered in normal un-flipped space)
        if (this.isCharging) {
            this.drawOrderBadge(ctx, drawX, drawY);
        }
    }

    drawBull(ctx) {
        const legOffset = Math.sin(this.runCycle) * 7;
        const headBob = Math.sin(this.runCycle * 2) * 2;

        ctx.save();
        ctx.translate(0, -this.height * 0.5);

        // Bull Body (Muscular dark bronze/gold metallic torso)
        ctx.fillStyle = '#C67D0A';
        ctx.beginPath();
        ctx.ellipse(0, 0 + headBob, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Muscle highlights
        ctx.fillStyle = '#E5A024';
        ctx.beginPath();
        ctx.ellipse(-4, -4 + headBob, 14, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 4 Running Legs
        ctx.strokeStyle = '#8C5200';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Front leg 1 & 2
        ctx.beginPath();
        ctx.moveTo(12, 6 + headBob);
        ctx.lineTo(16 + legOffset, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 6 + headBob);
        ctx.lineTo(10 - legOffset, 18);
        ctx.stroke();

        // Back leg 1 & 2
        ctx.beginPath();
        ctx.moveTo(-12, 6 + headBob);
        ctx.lineTo(-16 - legOffset, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-8, 6 + headBob);
        ctx.lineTo(-6 + legOffset, 18);
        ctx.stroke();

        // Bull Head & Snout
        ctx.fillStyle = '#B36B00';
        ctx.beginPath();
        ctx.ellipse(18, -4 + headBob, 10, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#E5A024';
        ctx.beginPath();
        ctx.ellipse(24, -2 + headBob, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Curved Horns (Gleaming!)
        ctx.strokeStyle = '#FFEA00';
        ctx.shadowColor = '#FFEA00';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(16, -10 + headBob);
        ctx.quadraticCurveTo(20, -22 + headBob, 28, -18 + headBob);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing Emerald Eye
        ctx.fillStyle = '#00E676';
        ctx.shadowColor = '#00E676';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(17, -6 + headBob, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Red Wall Street Power Tie flapping in the wind!
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.moveTo(14, 2 + headBob);
        ctx.lineTo(2, 8 + Math.sin(this.runCycle) * 3);
        ctx.lineTo(4, 12 + Math.sin(this.runCycle) * 3);
        ctx.lineTo(16, 5 + headBob);
        ctx.closePath();
        ctx.fill();

        // Swishing Tail
        ctx.strokeStyle = '#8C5200';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-20, -2 + headBob);
        ctx.quadraticCurveTo(-28, -6 + Math.sin(this.runCycle * 1.5) * 6, -32, 2);
        ctx.stroke();

        ctx.restore();
    }

    drawBear(ctx) {
        const legOffset = Math.sin(this.runCycle) * 7;
        const headBob = Math.sin(this.runCycle * 2) * 2;

        ctx.save();
        ctx.translate(0, -this.height * 0.5);

        // Bear Body (Dark cyber-charcoal grizzly coat)
        ctx.fillStyle = '#2C3440';
        ctx.beginPath();
        ctx.ellipse(0, 0 + headBob, 24, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shaggy fur highlight
        ctx.fillStyle = '#414E60';
        ctx.beginPath();
        ctx.ellipse(-2, -4 + headBob, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 Running Claws/Legs
        ctx.strokeStyle = '#1A1F26';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Front legs
        ctx.beginPath();
        ctx.moveTo(12, 6 + headBob);
        ctx.lineTo(16 + legOffset, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, 6 + headBob);
        ctx.lineTo(10 - legOffset, 18);
        ctx.stroke();

        // Back legs
        ctx.beginPath();
        ctx.moveTo(-12, 6 + headBob);
        ctx.lineTo(-16 - legOffset, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-8, 6 + headBob);
        ctx.lineTo(-6 + legOffset, 18);
        ctx.stroke();

        // Bear Claws (Crimson Neon tipped!)
        ctx.fillStyle = '#FF1744';
        ctx.fillRect(14 + legOffset, 17, 4, 3);
        ctx.fillRect(-18 - legOffset, 17, 4, 3);

        // Bear Head & Snout
        ctx.fillStyle = '#232A34';
        ctx.beginPath();
        ctx.ellipse(18, -4 + headBob, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#414E60';
        ctx.beginPath();
        ctx.ellipse(25, -2 + headBob, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bear Cyber-Shades / Visor (Glowing Crimson!)
        ctx.fillStyle = '#FF1744';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(14, -8 + headBob, 10, 5, 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bear Ears
        ctx.fillStyle = '#2C3440';
        ctx.beginPath();
        ctx.arc(14, -14 + headBob, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawLightningArcs(ctx) {
        ctx.save();
        ctx.strokeStyle = '#00E5FF';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.8;

        const arcs = 3;
        for (let i = 0; i < arcs; i++) {
            ctx.beginPath();
            let startX = (Math.random() - 0.5) * 30;
            let startY = (Math.random() - 0.5) * 30;
            ctx.moveTo(startX, startY);

            for (let seg = 0; seg < 3; seg++) {
                startX += (Math.random() - 0.5) * 16;
                startY += (Math.random() - 0.5) * 16;
                ctx.lineTo(startX, startY);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    drawOrderBadge(ctx, drawX, drawY) {
        ctx.save();
        
        // Position badge above character (adjusted for bull/bear orientation)
        const badgeY = this.isBull ? drawY - 50 : drawY + 60;
        
        ctx.translate(drawX, badgeY);

        // Circular progress gauge around the order size
        const radius = 24;
        
        // Background ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Active charge arc (glowing yellow to gold to hot cyan)
        const chargeColor = this.chargeProgress > 0.8 ? '#FF0055' : (this.chargeProgress > 0.4 ? '#FFD700' : '#00E5FF');
        ctx.strokeStyle = chargeColor;
        ctx.shadowColor = chargeColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * this.chargeProgress));
        ctx.stroke();

        // Dark pill background
        ctx.fillStyle = 'rgba(10, 16, 28, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Number of lots text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.currentLots}`, 0, -2);

        // "LOTS" label below number
        ctx.fillStyle = chargeColor;
        ctx.font = '900 8px sans-serif';
        ctx.fillText('LOTS', 0, 9);

        // Pulsing "CHARGING" / "HOLD SPACE" tag above
        const pulse = 0.8 + Math.sin(this.time * 20) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(this.currentLots >= 100 ? '⚡ MAX SIZE!' : '⚡ CHARGING...', 0, this.isBull ? -34 : 36);

        ctx.restore();
    }
}
