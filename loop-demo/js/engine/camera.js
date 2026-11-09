// Bullimia Smooth Dynamic Tracking Camera
// Keeps the Bull/Bear and upcoming candlesticks framed with forward-lead and screen shake

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Lead ahead so player sees upcoming candles
        this.leadX = this.width * 0.32;
        
        // Damping factors for smooth lerping
        this.lerpSpeedX = 8.0;
        this.lerpSpeedY = 6.0;

        // Screen Shake
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.leadX = width * 0.32;
    }

    addShake(intensity = 5, duration = 0.25) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
    }

    update(targetX, targetY, dt) {
        // Target camera position puts the character slightly left of center
        this.targetX = targetX - this.leadX;
        this.targetY = targetY - this.height * 0.5;

        // Smooth exponential interpolation
        const factorX = 1 - Math.exp(-this.lerpSpeedX * dt);
        const factorY = 1 - Math.exp(-this.lerpSpeedY * dt);

        this.x += (this.targetX - this.x) * factorX;
        this.y += (this.targetY - this.y) * factorY;

        // Update Screen Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const decay = Math.max(0, this.shakeTimer / 0.25);
            const currentShake = this.shakeIntensity * decay;
            this.shakeOffsetX = (Math.random() - 0.5) * currentShake * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * currentShake * 2;
            if (this.shakeTimer <= 0) {
                this.shakeIntensity = 0;
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            }
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    applyTransform(ctx) {
        ctx.translate(
            -Math.round(this.x + this.shakeOffsetX),
            -Math.round(this.y + this.shakeOffsetY)
        );
    }

    worldToScreen(wx, wy) {
        return {
            x: wx - (this.x + this.shakeOffsetX),
            y: wy - (this.y + this.shakeOffsetY)
        };
    }

    screenToWorld(sx, sy) {
        return {
            x: sx + (this.x + this.shakeOffsetX),
            y: sy + (this.y + this.shakeOffsetY)
        };
    }
}
