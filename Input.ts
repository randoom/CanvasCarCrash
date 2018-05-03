export enum KeyCodes {
    enter = 13,
    up = 38,
    down = 40,
    left = 37,
    right = 39
}

export class Input {
    private readonly hasTouch = "ontouchstart" in document.documentElement;

    private keysDown: { [keyCode: number]: boolean; } = {};
    private laneClicked = -1;

    constructor(canvasEl: HTMLCanvasElement) {
        window.onkeydown = (e: KeyboardEvent): void => {
            this.keysDown[e.keyCode] = true;
            this.laneClicked = -1;
        };

        window.onkeyup = (e: KeyboardEvent): void => {
            this.keysDown[e.keyCode] = false;
        };

        if (this.hasTouch) {
            canvasEl.ontouchstart = (e: TouchEvent): void => {
                var t: Touch = e.touches[0];
                var x = t.pageX - canvasEl.offsetLeft;
                this.laneClicked = x < canvasEl.width / 2 ? 0 : 1;
            };
        } else {
            canvasEl.onmousedown = (e: MouseEvent): void => {
                var x = e.pageX - canvasEl.offsetLeft;
                this.laneClicked = x < canvasEl.width / 2 ? 0 : 1;
            };
        }
    }

    get laneChangeRequested(): number {
        if (this.keysDown[KeyCodes.left]) return 0;
        if (this.keysDown[KeyCodes.right]) return 1;
        if (this.laneClicked >= 0) return this.laneClicked;

        return -1;
    }

    isKeyDown(keyCode: number): boolean {
        return this.keysDown[keyCode] === true;
    }
}