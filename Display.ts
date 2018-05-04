export class Display {
    private canvasEl: HTMLCanvasElement;
    private context2d: CanvasRenderingContext2D;

    constructor() {
        var temp: any;

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

    public clear(): void {
        this.context.clearRect(0, 0, this.width, this.height);
    }
}