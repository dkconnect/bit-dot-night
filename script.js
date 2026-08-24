'use strict';

// 1. Deterministic fxhash PRNG Pipeline
const alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const fxhash = "oo" + Array(49).fill(0).map(() => alphabet[(Math.random() * alphabet.length) | 0]).join('');
const b58dec = str => [...str].reduce((p, c) => (p * alphabet.length + alphabet.indexOf(c)) | 0, 0);
const fxhashTrunc = fxhash.slice(2);
const regex = new RegExp(".{" + ((fxhash.length / 4) | 0) + "}", 'g');
const hashes = fxhashTrunc.match(regex).map(h => b58dec(h));

const sfc32 = (a, b, c, d) => {
    return () => {
        a |= 0; b |= 0; c |= 0; d |= 0;
        const t = (a + b | 0) + d | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
};
const fxrand = sfc32(...hashes);

// 2. 32-bit Xorshift PRNG Class
class Random {
    constructor(seed) { 
        this.setSeed(seed); 
    }
    
    setSeed(seed) { 
        this.seed = (seed | 0) || 0x12345678; 
    }
    
    float(a = 1, b = 0) {
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        const normalized = (this.seed >>> 0) / 4294967296;
        return b + (a - b) * normalized;
    }
    
    floatSign(a, b) { 
        return this.float(a, b) * this.sign(); 
    }
    
    int(a = 1, b = 0) { 
        return Math.floor(this.float(a, b)); 
    }
    
    bool(chance = 0.5) { 
        return this.float() < chance; 
    }
    
    sign() { 
        return this.bool() ? -1 : 1; 
    }
    
    angle(p = 1) { 
        return this.float(Math.PI * 2 * p); 
    }
}

const random = new Random(fxrand() * 4294967296);

const PI = Math.PI;
const mod = (a, b = 1) => ((a % b) + b) % b;
const clamp = (v, min = 0, max = 1) => (v < min ? min : v > max ? max : v);
const hsl = (h = 0, s = 0, l = 0, a = 1) => 
    `hsla(${mod(h) * 360},${clamp(s) * 100}%,${clamp(l) * 100}%,${clamp(a)})`;

class ArtGenerator {
    constructor(mainCanvas) {
        this.mainCanvas = mainCanvas;
        this.mainContext = mainCanvas.getContext('2d');
     
        this.mainCanvas.width = 2048;
        this.mainCanvas.height = 1024;

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = 4096;
        this.offscreenCanvas.height = 2048;
        this.offscreenContext = this.offscreenCanvas.getContext('2d');

        this.animationFrameId = null;
        this.frame = 0;
        this.params = {};
    }

    static applyOperator(operator, x, y, seedX, seedY) {
        const X = (x + seedX) | 0;
        const Y = (y + seedY) | 0;

        switch (operator) {
            case 0: return X & Y;                        // AND
            case 1: return X | Y;                        // OR
            case 2: return X ^ Y;                        // XOR
            case 3: return X + Y;                        // ADD
            case 4: return (Math.imul(X, Y)) | 0;        // MULTIPLY
            case 5: return ((X - Y) ^ (X + Y)) | 0;      // HYBRID
            default: return 0;
        }
    }

    setupParameters() {
        const p = this.params;
        const operatorCount = 6; 

        p.windowOperatorType = random.int(operatorCount);
        p.backgroundOperatorType = random.int(operatorCount);
        p.startScale = random.int(5, 9);

        p.moonCount = random.int(1, 4);
        if (random.bool(0.05)) p.moonCount = random.int(30, 60);
        if (random.bool(0.04)) p.moonCount = 0;
        p.bigMoon = random.bool(0.05) && p.moonCount !== 0;

        p.brightBuildings = random.bool(0.05);
        p.isInverted = random.bool(0.04);
        p.earthquake = random.bool(0.04);
        p.thinBuildings = random.bool(0.03);
        p.isGrayscale = random.bool(0.1);
        p.isRainbow = !p.isGrayscale && random.bool(0.03);
        p.shiftHue = !p.isRainbow && !p.isGrayscale && random.bool(0.1);

        p.extraHueOffset = p.shiftHue ? 0.5 : (p.isRainbow ? random.float() : 0);
        p.neonHue = random.float();
        p.windowHueOffset = random.float(0, 0.15);
        p.foreSat = random.float(p.isRainbow ? 0.4 : 0.1, 1);

        p.seedX = random.int(1e3);
        p.seedY = random.int(1e3);
        p.roomsPerSecond = random.float(2, 3);
        p.startY = random.float(99, 400);
    }

    drawSky() {
        const p = this.params;
        const ctx = this.offscreenContext;

        const bgHueInt = random.int(50, 100);
        const bgStartBright = random.float(0, 0.2);
        const bgSat = random.float(0.2, 0.9);
        const hueOffset = random.float(0.4, 0.75);
        const backBright = random.float(200, 600);
        const backBrightHue = random.int(500, 2e3);
        const scale = random.int(8, 33); 
        const w = Math.ceil(this.offscreenCanvas.width / scale);
        const h = Math.ceil(this.offscreenCanvas.height / scale);
        const seedScale = random.int(1e6);

        for (let k = w * h; k--;) {
            const i = k % w;
            const j = (k / w) | 0;
            const o = ArtGenerator.applyOperator(p.backgroundOperatorType, i, j, p.seedX, p.seedY);
            const bright = Math.cos(o * seedScale);
            const hue = bright * bgHueInt;

            ctx.fillStyle = hsl(
                p.extraHueOffset + hueOffset + hue / 800 + j / (p.isRainbow ? 100 : 300),
                bgSat + hue / 1800,
                bgStartBright + hue / backBrightHue + j / backBright
            );
            ctx.fillRect(i * scale, j * scale, scale, scale);
        }

        ctx.save();
        ctx.globalCompositeOperation = 'difference'; 
        ctx.fillStyle = '#fff'; 
        for (let i = p.moonCount; i--;) {
            const m = 99; 
            const r = p.bigMoon ? random.float(500, 700) : random.float(150, 300); 
            const x = random.float(m * 2 + r, this.offscreenCanvas.width - m * 2 - r);
            const y = random.float(m + r, m + r + 300);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2); 
            ctx.fill();
        }
        ctx.restore();
    }

    drawBuilding() {
        const p = this.params;
        const ctx = this.offscreenContext;
        const FPS = 60;
        const t = this.frame / FPS;

        const roomsWide = p.thinBuildings ? random.int(1, 4) : random.int(5, 12);
        const Y = p.startY + (t * 60) * 7 * roomsWide / p.roomsPerSecond;

        if (Y > this.offscreenCanvas.height + 500) { 
            cancelAnimationFrame(this.animationFrameId); 
            return;
        }

        ctx.save();
        if (p.earthquake) {
            ctx.translate(this.offscreenCanvas.width / 2, this.offscreenCanvas.height / 2);
            ctx.rotate(random.floatSign(0.1));
            ctx.translate(-this.offscreenCanvas.width / 2, -this.offscreenCanvas.height / 2);
        }

        const X = random.float(-200, this.offscreenCanvas.width + 200); 
        const w = roomsWide * 2 + 1; 
        const seedScale = random.int(1e6); 
        const scale = (p.startScale + t * 10) | 0;

        for (let k = 1e4; k--;) {
            const i = k % w;
            const j = (k / w) | 0; 
            const o = ArtGenerator.applyOperator(p.windowOperatorType, i, j, p.seedX, p.seedY); 
            const bright = Math.cos(o * seedScale); 

            const h = p.windowHueOffset - j * 0.001 + bright * (0.15 - p.windowHueOffset) + (p.isRainbow ? t : 0);
            let s = p.foreSat + random.floatSign(0.1);
            let l = bright;

            if (i * j % 2 === 0 && !p.brightBuildings) {
                l = s = 0;
            }
            
            const rectScale = scale + (p.earthquake ? random.float(0, 5) : 0);

            ctx.fillStyle = hsl(h + p.extraHueOffset, s, l); 
            ctx.fillRect((i * scale + X) | 0, (j * scale + Y) | 0, rectScale, rectScale);
        }
        ctx.restore();
    }

    compositeImage() {
        const p = this.params;
        const ctx = this.mainContext;

        const t = this.frame / 60;
        this.mainCanvas.style.boxShadow = `0px 0px 50px ${10 + 5 * Math.sin(t * PI / 2)}px ` +
            hsl((p.isRainbow ? t / 60 : 0) + p.neonHue, 1, p.isGrayscale ? 1 : 0.5);

        ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        ctx.drawImage(this.offscreenCanvas, 0, 0, this.mainCanvas.width, this.mainCanvas.height);

        if (p.isGrayscale) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.globalCompositeOperation = 'saturation';
            ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            ctx.restore();
        }
        if (p.isInverted) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.globalCompositeOperation = 'difference';
            ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            ctx.restore();
        }
    }

    update = () => {
        this.drawBuilding();
        this.compositeImage();
        this.frame++;
        this.animationFrameId = requestAnimationFrame(this.update);
    }

    startGeneration() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.frame = 0;
        this.setupParameters();
        this.drawSky();
        this.animationFrameId = requestAnimationFrame(this.update);
    }

    download() {
        const dataURL = this.offscreenCanvas.toDataURL('image/png'); 
        const a = document.createElement('a');
        a.href = dataURL;

        const date = new Date();
        const filename = `bit-dot-city-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}.png`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

const mainCanvas = document.getElementById('pixelArtCanvas');
const generator = new ArtGenerator(mainCanvas);

document.getElementById('generateBtn').addEventListener('click', () => {
    random.setSeed(fxrand() * 4294967296); 
    generator.startGeneration();
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    generator.download();
});

generator.startGeneration();
