import { CONFIG } from './Config.js';

export class Renderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Handle High DPI displays
        const dpr = window.devicePixelRatio || 1;

        const isMobile = window.innerWidth <= 768;

        let width;
        let height;

        if (isMobile) {
            // Mobile: Width constrained by screen width
            // Height calculated from width
            width = window.innerWidth - 20; // 20px padding
            height = width * 1.5;

            // If height is too tall for screen (leaving no room for header), scale down
            const maxH = window.innerHeight * 0.75; // Leave 25% for sidebar/header
            if (height > maxH) {
                height = maxH;
                width = height / 1.5;
            }
        } else {
            // Desktop: Height constrained by availHeight
            let availHeight = window.innerHeight * 0.9;
            width = availHeight / 1.5;

            // Ensure width doesn't exceed screen width (modulo sidebar)
            if (width > window.innerWidth - 200) {
                width = window.innerWidth - 200;
                // Recalculate height to maintain aspect ratio
                width = window.innerWidth - 220; // Extra safety
                // Fix: Ensure height matches new width
                height = width * 1.5;
            } else {
                height = availHeight; // Default case
            }
        }

        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = width;
        this.height = height;

        // Grid is square, based on width
        this.cellSize = (this.width - 20) / CONFIG.GRID_SIZE; // -20 for padding
        this.padding = 10;

        // Define Tray Area properties for public access
        this.gridEnd = this.width; // Y coordinate where grid ends (sqaure)
        this.trayTop = this.gridEnd + 20;
    }

    draw(dragState) {
        this.ctx.fillStyle = CONFIG.COLOR_BG;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Tray Background (Optional visual separation)
        this.ctx.fillStyle = "#fafafa"; // Slightly different
        this.ctx.fillRect(0, this.width, this.width, this.height - this.width);

        // Separator Line
        this.ctx.strokeStyle = "#eee";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.width);
        this.ctx.lineTo(this.width, this.width);
        this.ctx.stroke();

        this.drawGrid();
        if (dragState && dragState.isDragging) {
            this.drawDragShadow(dragState); // Draw shadow where it would land
            this.drawFloatingBlock(dragState); // Draw the block itself
        }
    }

    drawGrid() {
        const { GRID_SIZE, COLOR_GRID_EMPTY, COLOR_GRID_LINES } = CONFIG;

        this.ctx.translate(this.padding, this.padding);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;

                // Draw Cell Background
                this.ctx.fillStyle = COLOR_GRID_EMPTY;

                // Check if filled
                const cell = this.grid.cells[r][c];
                if (cell) {
                    this.ctx.fillStyle = cell.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = cell.color;
                } else {
                    this.ctx.shadowBlur = 0;
                }

                // Rounded Rect for nice look
                this.roundRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2, 4);
                this.ctx.fill();
            }
        }

        this.ctx.translate(-this.padding, -this.padding);
        this.ctx.shadowBlur = 0; // Reset
    }

    drawFloatingBlock(dragState) {
        // Draw the block at pointer coordinates
        // Centered on the finger/mouse
        const { shape, x, y, color } = dragState;
        if (!shape) return;

        // Calculate block dimensions to center it
        const blockW = shape[0].length * this.cellSize;
        const blockH = shape.length * this.cellSize;

        const drawX = x - blockW / 2;
        const drawY = y - blockH / 2; // Slightly above finger usually better for visibility

        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;

        shape.forEach((row, r) => {
            row.forEach((active, c) => {
                if (active) {
                    this.roundRect(
                        drawX + c * this.cellSize + 1,
                        drawY + r * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2,
                        4
                    );
                    this.ctx.fill();
                }
            });
        });
        this.ctx.shadowBlur = 0;
    }

    // Shadow preview where it will drop
    drawDragShadow(dragState) {
        const { gridX, gridY, shape, valid } = dragState;
        if (gridX === null || gridY === null || !valid) return;

        this.ctx.translate(this.padding, this.padding);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

        shape.forEach((row, r) => {
            row.forEach((active, c) => {
                if (active) {
                    this.roundRect(
                        (gridX + c) * this.cellSize + 1,
                        (gridY + r) * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2,
                        4
                    );
                    this.ctx.fill();
                }
            });
        });

        this.ctx.translate(-this.padding, -this.padding);
    }

    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, r);
        this.ctx.closePath();
    }
}
