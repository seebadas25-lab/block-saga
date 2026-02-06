import { CONFIG } from './Config.js';

export class Grid {
    constructor() {
        this.size = CONFIG.GRID_SIZE;
        this.cells = Array(this.size).fill(null).map(() => Array(this.size).fill(null)); // null = empty, object = filled { color: string }
    }

    /**
     * Checks if a block shape can be placed at grid coordinates (x, y)
     * @param {number} startX Grid X
     * @param {number} startY Grid Y
     * @param {number[][]} shape Shape matrix (0/1)
     */
    canPlace(startX, startY, shape) {
        const height = shape.length;
        const width = shape[0].length;

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (shape[r][c] !== 0) {
                    const gx = startX + c;
                    const gy = startY + r;

                    // Out of bounds
                    if (gx < 0 || gx >= this.size || gy < 0 || gy >= this.size) {
                        return false;
                    }

                    // Already filled
                    if (this.cells[gy][gx] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Places a block shape on the grid
     */
    place(startX, startY, shape, color) {
        const height = shape.length;
        const width = shape[0].length;

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (shape[r][c] !== 0) {
                    this.cells[startY + r][startX + c] = { color };
                }
            }
        }
    }

    /**
     * Checks for full rows and columns.
     * Returns list of indices to clear: { rows: [], cols: [] }
     */
    checkLines() {
        const lines = { rows: [], cols: [] };

        // Check rows
        for (let r = 0; r < this.size; r++) {
            if (this.cells[r].every(cell => cell !== null)) {
                lines.rows.push(r);
            }
        }

        // Check columns
        for (let c = 0; c < this.size; c++) {
            let full = true;
            for (let r = 0; r < this.size; r++) {
                if (this.cells[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                lines.cols.push(c);
            }
        }

        return lines;
    }

    /**
     * Clears specified rows and columns
     */
    clearLines(lines) {
        // We accumulate updates to avoid partial clears affecting logic if we did it sequentially? 
        // Actually clearing logic is simple set to null.

        // This simple clear might overlap (cross), which is fine.

        lines.rows.forEach(r => {
            for (let c = 0; c < this.size; c++) this.cells[r][c] = null;
        });

        lines.cols.forEach(c => {
            for (let r = 0; r < this.size; r++) this.cells[r][c] = null;
        });
    }
}
