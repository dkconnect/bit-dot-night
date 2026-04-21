'use strict';

// ------------------ SEED SYSTEM ------------------

let alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

function generateFxhash() {
    return "oo" + Array(49).fill(0).map(_ =>
        alphabet[(Math.random() * alphabet.length) | 0]
    ).join('');
}

let fxhash = generateFxhash();

let b58dec = str => [...str].reduce((p, c) =>
    p * alphabet.length + alphabet.indexOf(c) | 0, 0);

let fxhashTrunc, hashes, fxrand;

function rebuildSeed() {
    fxhashTrunc = fxhash.slice(2);
    let regex = new RegExp(".{" + ((fxhash.length / 4) | 0) + "}", 'g');
    hashes = fxhashTrunc.match(regex).map(h => b58dec(h));
    fxrand = sfc32(...hashes);
}

let sfc32 = (a, b, c, d) => () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
};

// ------------------ RANDOM CLASS ------------------

class Random {
    constructor(seed) { this.setSeed(seed); }
    setSeed(seed) { this.seed = seed | 0; }

    float(a = 1, b = 0) {
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        return b + (a - b) * Math.abs(this.seed % 1e9) / 1e9;
    }

    int(a = 1, b = 0) { return this.float(a, b) | 0; }
    bool(chance = .5) { return this.float() < chance; }
}

let random;

// ------------------ UTILS ------------------

const PI = Math.PI;

const hsl = (h, s, l, a = 1) =>
    `hsla(${(h % 1) * 360},${s * 100}%,${l * 100}%,${a})`;

// ------------------ ART GENERATOR ------------------

class ArtGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.offscreen = document.createElement('canvas');
        this.offctx = this.offscreen.getContext('2d');

        this.buildingCanvas = document.createElement('canvas');
        this.buildingCtx = this.buildingCanvas.getContext('2d');

        this.frame = 0;

        this.resizeCanvas();
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = window.innerWidth * 0.75 * dpr;
        this.canvas.height = window.innerHeight * 0.7 * dpr;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    setup() {
        this.params = {
            moonCount: random.int(1, 4),
            isRainbow: random.bool(0.1),
            isGrayscale: random.bool(0.1),
            earthquake: random.bool(0.05),
            thinBuildings: random.bool(0.2)
        };

        this.offscreen.width = 2048;
        this.offscreen.height = 1024;
    }

    updateTraitsUI() {
        const p = this.params;
        document.getElementById('traitsPanel').innerHTML = `
            Moon Count: ${p.moonCount}<br>
            Rainbow: ${p.isRainbow}<br>
            Grayscale: ${p.isGrayscale}<br>
            Earthquake: ${p.earthquake}<br>
            Thin Buildings: ${p.thinBuildings}
        `;
    }

    drawSky() {
        const ctx = this.offctx;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);

        // stars
        for (let i = 0; i < 300; i++) {
            let x = random.float(0, this.offscreen.width);
            let y = random.float(0, this.offscreen.height);
            ctx.fillStyle = "white";
            ctx.fillRect(x, y, 2, 2);
        }
    }

    generateBuildings() {
        const ctx = this.buildingCtx;
        const p = this.params;

        this.buildingCanvas.width = this.offscreen.width;
        this.buildingCanvas.height = this.offscreen.height;

        for (let i = 0; i < 1000; i++) {
            let x = random.float(0, this.buildingCanvas.width);
            let h = random.float(50, 400);

            ctx.fillStyle = hsl(random.float(), 1, 0.5);
            ctx.fillRect(x, this.buildingCanvas.height - h, 20, h);
        }
    }

    draw() {
        this.offctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);

        this.drawSky();

        let y = (this.frame * 2) % this.offscreen.height;
        this.offctx.drawImage(this.buildingCanvas, 0, y);

        this.ctx.drawImage(this.offscreen, 0, 0, this.canvas.width, this.canvas.height);

        this.frame++;
        requestAnimationFrame(() => this.draw());
    }

    start() {
        this.frame = 0;
        this.setup();
        this.updateTraitsUI();
        this.generateBuildings();
        this.draw();
    }

    download() {
        const a = document.createElement('a');
        a.href = this.offscreen.toDataURL();
        a.download = `bit-dot-${fxhash}.png`;
        a.click();
    }
}

// ------------------ INIT ------------------

rebuildSeed();
random = new Random(fxrand() * 1e9);

const canvas = document.getElementById('pixelArtCanvas');
const generator = new ArtGenerator(canvas);

generator.start();

// ------------------ EVENTS ------------------

document.getElementById('generateBtn').onclick = () => {
    const input = document.getElementById('seedInput').value.trim();

    fxhash = input || generateFxhash();

    rebuildSeed();
    random = new Random(fxrand() * 1e9);

    console.log("Seed:", fxhash);

    generator.start();
};

document.getElementById('downloadBtn').onclick = () => {
    generator.download();
};

window.addEventListener('resize', () => {
    generator.resizeCanvas();
});
