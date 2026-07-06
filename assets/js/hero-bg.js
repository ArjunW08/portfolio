/**
 * Neural Network / Transformer Background Animation
 * 
 * Global full-page background for all pages.
 * Auto-injects a fixed canvas into <body>.
 */
(function () {
    /* ---------- inject canvas ---------- */
    const canvas = document.createElement('canvas');
    canvas.id = 'nn-bg-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    /* ---------- sizing ---------- */
    let W, H;
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildNetwork();
        initEntities();
    }
    window.addEventListener('resize', resize);

    /* ---------- colours ---------- */
    // ACCENT (Peach): rgb(255, 189, 118)
    const ACCENT = { r: 255, g: 189, b: 118 };
    // ACCENT2 (Teal): rgb(0, 63, 71)
    const ACCENT2 = { r: 0, g: 63, b: 71 };
    function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }

    /* ---------- network ---------- */
    const LAYER_COUNT = 6;
    const NODES_PER_LAYER = 5;       // fewer nodes per layer
    const MIN_NODE_SPACING = 120;     // minimum px between nodes vertically
    let nodes = [];
    let connections = [];

    function buildNetwork() {
        nodes = [];
        connections = [];

        // Spread layers across FULL width — edge-to-edge with padding
        const pad = 40;                                   // small padding from edges
        const layerGap = (W - pad * 2) / (LAYER_COUNT - 1);

        for (let l = 0; l < LAYER_COUNT; l++) {
            const baseX = pad + layerGap * l;
            const nodeGap = Math.max(MIN_NODE_SPACING, H / (NODES_PER_LAYER + 1));
            const totalH = nodeGap * (NODES_PER_LAYER - 1);
            const startY = (H - totalH) / 2;             // centre vertically

            for (let n = 0; n < NODES_PER_LAYER; n++) {
                const y = startY + nodeGap * n;
                nodes.push({
                    x: baseX + (Math.random() - 0.5) * 60,
                    y: y + (Math.random() - 0.5) * 40,
                    layer: l,
                    radius: 2 + Math.random() * 2,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }

        // Connect each node to 1-2 random nodes in the next layer
        for (let l = 0; l < LAYER_COUNT - 1; l++) {
            const layerA = nodes.filter(nd => nd.layer === l);
            const layerB = nodes.filter(nd => nd.layer === l + 1);
            for (const a of layerA) {
                const count = 1 + Math.floor(Math.random() * 2);   // 1 or 2 connections
                const targets = [...layerB].sort(() => Math.random() - 0.5).slice(0, count);
                for (const b of targets) {
                    connections.push({ from: a, to: b });
                }
            }
        }
    }

    /* ---------- data particles ---------- */
    class Particle {
        constructor() { this.reset(); }
        reset() {
            if (connections.length === 0) return;
            const conn = connections[Math.floor(Math.random() * connections.length)];
            this.from = conn.from;
            this.to = conn.to;
            this.t = 0;
            this.speed = 0.001 + Math.random() * 0.002;   // much slower
            this.size = 1.2 + Math.random() * 1.5;
            this.color = Math.random() > 0.5 ? ACCENT : ACCENT2;
        }
        update() {
            this.t += this.speed;
            if (this.t >= 1) this.reset();
        }
        draw() {
            if (!this.from || !this.to) return;
            const x = this.from.x + (this.to.x - this.from.x) * this.t;
            const y = this.from.y + (this.to.y - this.from.y) * this.t;
            const alpha = Math.sin(this.t * Math.PI);
            // Glow
            ctx.beginPath();
            ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = rgba(this.color, alpha * 0.12);
            ctx.fill();
            // Core
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = rgba(this.color, alpha * 0.6);
            ctx.fill();
        }
    }

    const PARTICLE_COUNT = 25;       // fewer particles
    let particles = [];

    /* ---------- floating tokens ---------- */
    const TOKEN_WORDS = [
        'attention', 'query', 'key', 'value', 'softmax', 'embed',
        'token', 'layer', 'decode', 'encode', 'model', 'weight',
        'bias', 'gradient', 'loss', 'output', 'input', 'vector',
        'matrix', 'transform', 'norm', 'linear', 'context', 'sequence',
        'predict', 'generate', 'learn', 'train', 'infer', 'optimize'
    ];

    class FloatingToken {
        constructor() { this.reset(); }
        reset() {
            this.word = TOKEN_WORDS[Math.floor(Math.random() * TOKEN_WORDS.length)];
            this.x = Math.random() * (W || 1200);
            this.y = Math.random() * (H || 800);
            this.vx = (Math.random() - 0.5) * 0.1;       // very gentle drift
            this.vy = -0.05 - Math.random() * 0.08;       // very slow upward float
            this.life = 0;
            this.maxLife = 600 + Math.random() * 600;      // much longer lifespan
            this.size = 11 + Math.random() * 3;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life++;
            if (this.life > this.maxLife || this.y < -20) this.reset();
        }
        draw() {
            const progress = this.life / this.maxLife;
            let alpha;
            if (progress < 0.15) alpha = progress / 0.15;        // slow fade in
            else if (progress > 0.85) alpha = (1 - progress) / 0.15;  // slow fade out
            else alpha = 1;
            alpha *= 0.12;
            ctx.font = `${this.size}px -apple-system, system-ui, sans-serif`;
            // Fixed token color to crisp dark navy rgb(10, 23, 29)
            ctx.fillStyle = `rgba(10, 23, 29, ${alpha})`;
            ctx.fillText(this.word, this.x, this.y);
        }
    }

    const TOKEN_COUNT = 12;          // moderate count
    let tokens = [];

    /* ---------- init entities ---------- */
    function initEntities() {
        particles = [];
        tokens = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
        for (let i = 0; i < TOKEN_COUNT; i++) {
            const t = new FloatingToken();
            t.life = Math.random() * t.maxLife;
            tokens.push(t);
        }
    }

    /* ---------- generation beam ---------- */
    let beamX = 0;
    const BEAM_SPEED = 0.2;         // slower beam

    /* ---------- animation loop ---------- */
    let time = 0;
    function animate() {
        time++;
        ctx.clearRect(0, 0, W, H);

        // Connections
        for (const conn of connections) {
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.strokeStyle = rgba(ACCENT, 0.08);
            ctx.lineWidth = 0.7;
            ctx.stroke();
        }

        // Nodes — gentle pulsing
        for (const node of nodes) {
            const pulse = Math.sin(time * 0.012 + node.pulse) * 0.5 + 0.5;  // slower pulse
            const r = node.radius + pulse * 1;
            // Outer glow
            ctx.beginPath();
            ctx.arc(node.x, node.y, r * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = rgba(ACCENT, 0.03 + pulse * 0.02);
            ctx.fill();
            // Core
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
            ctx.fillStyle = rgba(ACCENT, 0.15 + pulse * 0.1);
            ctx.fill();
        }

        // Particles
        for (const p of particles) { p.update(); p.draw(); }

        // Tokens
        for (const t of tokens) { t.update(); t.draw(); }

        // Beam sweep
        beamX += BEAM_SPEED;
        if (beamX > W + 120) beamX = -120;
        const grad = ctx.createLinearGradient(beamX - 80, 0, beamX + 80, 0);
        grad.addColorStop(0, 'rgba(255,189,118,0)');
        grad.addColorStop(0.5, 'rgba(255,189,118,0.04)');
        grad.addColorStop(1, 'rgba(255,189,118,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(beamX - 80, 0, 160, H);

        requestAnimationFrame(animate);
    }

    /* ---------- boot ---------- */
    resize();
    animate();
})();
