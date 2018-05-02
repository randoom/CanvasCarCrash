export class Display {
    private scoreEl: HTMLElement;
    private livesEl: HTMLElement;
    private canvasEl: HTMLCanvasElement;
    private context2d: CanvasRenderingContext2D;

    constructor() {
        var temp: any;

        temp = document.getElementById("score");
        if (!temp) throw "Score element not found";
        this.scoreEl = temp;

        temp = document.getElementById("lives");
        if (!temp) throw "Lives element not found";
        this.livesEl = temp;

        temp = document.getElementById("canvas");
        if (!temp) throw "Canvas element not found";
        this.canvasEl = <HTMLCanvasElement>temp;

        temp = this.canvasEl.getContext("2d");
        if (!temp) throw "Can't get 2D context of canvas";
        this.context2d = temp;
    }

    get width(): number {
        return this.canvasEl.width;
    }

    get height(): number {
        return this.canvasEl.height;
    }

    get canvas(): HTMLCanvasElement {
        return this.canvasEl;
    }

    get context(): CanvasRenderingContext2D {
        return this.context2d;
    }

    public updateScore(score: number): void {
        this.scoreEl.innerHTML = "" + score;
    }

    public updateLives(lives: number): void {
        this.livesEl.innerHTML = "" + lives;
    }

    public clear(): void {
        this.context.clearRect(0, 0, this.width, this.height);
    }
}