export class Input {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;

        // Bind methods
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);

        this.setupListeners();
    }

    setupListeners() {
        // Prevent scrolling/zooming when touching the canvas
        this.canvas.style.touchAction = 'none';

        this.canvas.addEventListener('pointerdown', this.handleDown);
        window.addEventListener('pointermove', this.handleMove);
        window.addEventListener('pointerup', this.handleUp);
        window.addEventListener('pointercancel', this.handleUp);
    }

    getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Return CSS pixel coordinates (game logic uses CSS pixels)
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleDown(e) {
        e.preventDefault();
        const { x, y } = this.getCoords(e);
        this.game.onPointerDown(x, y);
    }

    handleMove(e) {
        const { x, y } = this.getCoords(e);
        this.game.onPointerMove(x, y);
    }

    handleUp(e) {
        this.game.onPointerUp();
    }
}
