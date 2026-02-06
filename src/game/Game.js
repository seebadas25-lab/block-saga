import { Grid } from './Grid.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { getRandomShape, SHAPES } from './Shapes.js';
import { CONFIG } from './Config.js';

import { Particle } from './Particle.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.grid = new Grid();
        this.renderer = new Renderer(this.canvas, this.grid);
        this.input = new Input(this.canvas, this);

        // Game State
        this.score = 0;
        this.bestScore = localStorage.getItem('block-blast-best') || 0;
        this.combo = 0; // Track consecutive clears

        // The blocks currently available to drag
        // We will store them as objects: { shape, color, id, x, y, width, height }
        this.hand = [];
        this.particles = []; // Particles array

        this.dragState = {
            isDragging: false,
            blockIndex: -1, // Which block in hand
            shape: null,
            color: null,
            x: 0,
            y: 0,
            gridX: null, // snapped grid coord
            gridY: null,
            valid: false
        };

        this.initHand();
        this.updateUI();

        this.lastTime = 0;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initHand() {
        this.hand = [];
        for (let i = 0; i < 3; i++) {
            this.addBlockToHand(i);
        }
    }

    addBlockToHand(index) {
        const { shape } = getRandomShape();
        const color = CONFIG.BLOCK_COLORS[Math.floor(Math.random() * CONFIG.BLOCK_COLORS.length)];

        this.hand[index] = {
            shape,
            color,
            width: shape[0].length,
            height: shape.length,
            // We calculate screen X/Y in renderer or here.
            // Let's just store logical state here.
        };
    }

    loop(timestamp) {
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.renderer.draw(this.dragState);
        this.drawHand(); // We'll delegate this to renderer eventually, but for now simple 2D draw

        // Update and draw Particles
        // Ideally render particles inside renderer, but for now simple overlay
        if (this.particles.length > 0) {
            this.renderer.ctx.save();
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update();
                p.draw(this.renderer.ctx);
                if (p.life <= 0) this.particles.splice(i, 1);
            }
            this.renderer.ctx.restore();
        }

        requestAnimationFrame(this.loop);
    }

    // This checks if we clicked on a UI block
    onPointerDown(x, y) {
        // Layout Logic must match drawHand
        // Tray Area starts after Grid (renderer.width is grid height)
        // Let's center items in the remaining space
        const trayTop = this.renderer.width;
        const trayHeight = this.renderer.height - trayTop;
        const trayCenterY = trayTop + trayHeight / 2;

        const totalWidth = this.renderer.width;
        // Divide width into 3 equal parts
        const slotWidth = totalWidth / 3;

        for (let i = 0; i < 3; i++) {
            const block = this.hand[i];
            if (!block) continue;

            // Center of the slot
            const bx = i * slotWidth + slotWidth / 2;
            const by = trayCenterY;

            // Simple hit test - Box based on scale
            // Scale in tray is usually smaller, say 0.6
            const scale = 0.6;
            const cellSize = this.renderer.cellSize * scale;
            const w = block.shape[0].length * cellSize;
            const h = block.shape.length * cellSize;

            // Check if point is inside centered box
            // Increased hit area slightly (+30) for better touch
            if (x >= bx - w / 2 - 30 && x <= bx + w / 2 + 30 &&
                y >= by - h / 2 - 30 && y <= by + h / 2 + 30) {
                this.startDrag(i, x, y);
                break;
            }
        }
    }

    startDrag(index, x, y) {
        const block = this.hand[index];
        this.dragState = {
            isDragging: true,
            blockIndex: index,
            shape: block.shape,
            color: block.color,
            x,
            y,
            gridX: null,
            gridY: null,
            valid: false
        };
        // We hide the block from the hand while dragging?
        // Or just render it being dragged.
    }

    onPointerMove(x, y) {
        if (!this.dragState.isDragging) return;

        this.dragState.x = x;
        this.dragState.y = y;

        // Map to Grid
        // Grid TopLeft: (padding, padding)
        // Grid Cell Size: renderer.cellSize
        const r = this.renderer;

        // Calculate the top-left corner of the shape relative to mouse finger
        // We want finger to be center of shape
        const blockW = this.dragState.shape[0].length * r.cellSize;
        const blockH = this.dragState.shape.length * r.cellSize;

        const shapeLeft = x - blockW / 2;
        const shapeTop = y - blockH / 2;

        // Convert to Grid Index
        // x = padding + col * cellSize
        // col = (x - padding) / cellSize
        const floatCol = (shapeLeft - r.padding) / r.cellSize;
        const floatRow = (shapeTop - r.padding) / r.cellSize;

        const col = Math.round(floatCol);
        const row = Math.round(floatRow);

        this.dragState.gridX = col;
        this.dragState.gridY = row;

        // Check validity
        this.dragState.valid = this.grid.canPlace(col, row, this.dragState.shape);
    }

    onPointerUp() {
        if (!this.dragState.isDragging) return;

        if (this.dragState.valid) {
            this.placeBlock();
        } else {
            // Cancel - Animation back to hand? To be added.
            console.log("Invalid placement");
        }

        this.dragState.isDragging = false;
        this.dragState.blockIndex = -1;
    }

    placeBlock() {
        const { gridX, gridY, shape, color, blockIndex } = this.dragState;

        // 1. Update Grid
        this.grid.place(gridX, gridY, shape, color);

        // 2. Remove from Hand
        this.hand[blockIndex] = null;

        // 3. Clear Lines
        const lines = this.grid.checkLines();
        const count = lines.rows.length + lines.cols.length;

        if (count > 0) {
            this.combo++; // Consecutive clear increment

            // Spawn Particles
            this.spawnClearParticles(lines);

            this.grid.clearLines(lines);

            // Score Calculation with Combo
            // Base: 10 per line. 
            // Combo Multiplier: 1 + (combo * 0.5) maybe? Or just x Combo.
            // Let's make it impactful.
            const moveScore = (count * 10) + (this.combo * 10);

            this.addScore(moveScore);

            // Show Floating Text
            if (this.combo > 1) {
                this.showFloatingText(`COMBO x${this.combo}!`, this.dragState.x, this.dragState.y);
            } else if (count > 1) {
                this.showFloatingText(`PERFECT!`, this.dragState.x, this.dragState.y);
            }

        } else {
            this.combo = 0; // Reset combo if no lines cleared
            this.addScore(10); // Just placement points
        }

        // 4. Check if Hand Empty -> Refill
        if (this.hand.every(b => b === null)) {
            this.initHand();
        }

        // 5. Check Game Over
        this.checkGameOver();
    }

    addScore(points) {
        this.score += points;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('block-blast-best', this.bestScore);
        }

        this.updateUI();
    }

    showFloatingText(text, x, y) {
        // Simple DOM floating text
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.getElementById('ui-layer').appendChild(el);

        // CSS Animation handles movement/fade
        setTimeout(() => el.remove(), 1000);
    }

    checkGameOver() {
        // For every block in hand, can it be placed ANYWHERE?
        let canMove = false;

        // Optimization: Checking every cell for every shape is expensive? 
        // 8x8 = 64 cells. 3 shapes. 192 checks. Negligible.

        for (const block of this.hand) {
            if (!block) continue;
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
                for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
                    if (this.grid.canPlace(c, r, block.shape)) {
                        canMove = true;
                        break;
                    }
                }
                if (canMove) break;
            }
            if (canMove) break;
        }

        if (!canMove && !this.hand.every(b => b === null)) {
            alert("Game Over! Score: " + this.score);
            this.reset();
        }
    }

    reset() {
        this.grid = new Grid();
        this.renderer.grid = this.grid; // Update ref
        this.score = 0;
        this.initHand();
        this.updateUI();
    }

    spawnClearParticles(lines) {
        const r = this.renderer;
        // Use block colors or a generic sparkle. 
        // For light mode, maybe a gold or mixed color? 
        // Let's use the color of blocks if we tracked it, but currently lines dont have color info easily accessible here.
        // Let's use a nice gold/dark color for contrast.
        const color = '#FFD700'; // Gold Sparkle

        const spawnAt = (gx, gy) => {
            const x = r.padding + gx * r.cellSize + r.cellSize / 2;
            const y = r.padding + gy * r.cellSize + r.cellSize / 2;
            for (let k = 0; k < 5; k++) {
                this.particles.push(new Particle(x, y, color));
            }
        };

        lines.rows.forEach(row => {
            for (let c = 0; c < CONFIG.GRID_SIZE; c++) spawnAt(c, row);
        });
        lines.cols.forEach(col => {
            for (let r = 0; r < CONFIG.GRID_SIZE; r++) spawnAt(col, r);
        });
    }

    updateUI() {
        // Document DOM updates
        const sEl = document.getElementById('score');
        const bEl = document.getElementById('best');
        if (sEl) sEl.innerText = this.score;
        if (bEl) bEl.innerText = this.bestScore;
    }

    // Preliminary Hand Drawing (Ideally moved to Renderer)
    drawHand() {
        if (!this.renderer) return;
        const ctx = this.renderer.ctx;

        // Tray Area
        const trayTop = this.renderer.width;
        const trayHeight = this.renderer.height - trayTop;
        const trayCenterY = trayTop + trayHeight / 2;

        const totalWidth = this.renderer.width;
        const slotWidth = totalWidth / 3;

        // Small scale for tray
        const scale = 0.6;
        const cell = this.renderer.cellSize * scale;

        for (let i = 0; i < 3; i++) {
            // Don't draw if dragging THIS one
            if (this.dragState.isDragging && this.dragState.blockIndex === i) continue;

            const block = this.hand[i];
            if (!block) continue;

            // Center of the slot
            const bx = i * slotWidth + slotWidth / 2;
            const by = trayCenterY;

            const w = block.shape[0].length * cell;
            const h = block.shape.length * cell;

            const startX = bx - w / 2;
            const startY = by - h / 2;

            ctx.fillStyle = block.color;
            ctx.shadowBlur = 0; // No glow in hand to keep it clean? Or small glow

            block.shape.forEach((row, r) => {
                row.forEach((active, c) => {
                    if (active) {
                        this.renderer.roundRect(
                            startX + c * cell,
                            startY + r * cell,
                            cell - 2,
                            cell - 2,
                            2
                        );
                        ctx.fill();
                    }
                });
            });
        }
    }
}
