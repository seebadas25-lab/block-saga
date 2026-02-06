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
        this.canvas.addEventListener('pointerdown', this.handleDown);
        window.addEventListener('pointermove', this.handleMove);
        window.addEventListener('pointerup', this.handleUp);
    }

    getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleDown(e) {
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
