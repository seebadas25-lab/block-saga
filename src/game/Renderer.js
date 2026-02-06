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

        // Target Aspect Ratio: Width : Height = 2 : 3 (1 : 1.5)
        const ASPECT_RATIO = 1.5;

        // Available space calculation
        let maxWidth, maxHeight;

        if (window.innerWidth <= 768) {
            // Mobile: Full width minus padding, Height allows for UI
            maxWidth = window.innerWidth - 30; // 15px padding each side
            // Reserve space for sidebar/header (approx 80px or 15%)
            let sidebarHeight = 100; // Estimated header height
            maxHeight = window.innerHeight - sidebarHeight - 20;
        } else {
            // Desktop: Sidebar is on left (200px approx), so we have rest of width
            // But usually height is the limiting factor on desktop
            maxWidth = window.innerWidth - 220;
            maxHeight = window.innerHeight * 0.9;
        }

        // Calculate dimensions to fit within Box (maxWidth x maxHeight) 
        // while maintaining ASPECT_RATIO

        let width = maxWidth;
        let height = width * ASPECT_RATIO;

        // If height exceeds available height, scale down
        if (height > maxHeight) {
            height = maxHeight;
            width = height / ASPECT_RATIO;
        }

        // Snap to integers to avoid sub-pixel blurring
        width = Math.floor(width);
        height = Math.floor(height);

        // Apply style (CSS pixels)
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Apply buffer size (Physical pixels)
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        // Game Logic Dimensions
        this.width = width;
        this.height = height;

        // Grid (Square top part)
        this.cellSize = (this.width - 20) / CONFIG.GRID_SIZE;
        this.padding = 10;

        // Define Tray Area properties for public access
        this.gridEnd = this.width;
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
