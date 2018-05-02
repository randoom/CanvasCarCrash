export class Display {
    private scoreEl: HTMLElement = document.getElementById("score");
    private livesEl: HTMLElement = document.getElementById("lives");
    private canvasEl: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
    private context2d: CanvasRenderingContext2D = this.canvasEl.getContext("2d");

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