import { IPoolable } from "./ObjectPool";

export enum ObstacleType {
    wall = "wall",
    money = "money",
    dirt = "dirt"
}

abstract class GameObject {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;

    abstract draw(context: CanvasRenderingContext2D): void;
}

const carStartSpeed = 0.4;
const carEndSpeed = 1.0;
const carAcceleration = 0.00075;

export class Road extends GameObject {
    private image: HTMLImageElement;

    public distance = 0;

    constructor(image: HTMLImageElement, height: number) {
        super();

        this.image = image;
        this.width = this.image.width;
        this.height = height;
    }

    draw(context: CanvasRenderingContext2D): void {
        let segmentHeight = this.distance % this.image.height;

        if (segmentHeight > 0) {
            context.drawImage(this.image,
                0, this.image.height - segmentHeight,
                this.width, segmentHeight,
                this.x, this.y,
                this.width, segmentHeight);
        }

        let drawnHeight = Math.floor(segmentHeight);

        while (drawnHeight < this.height) {
            segmentHeight = Math.min(this.image.height, this.height - drawnHeight);

            context.drawImage(this.image,
                0, 0,
                this.width, segmentHeight,
                this.x, this.y + drawnHeight,
                this.width, segmentHeight);

            drawnHeight += this.image.height;
        }
    }
}

export class Car extends GameObject {
    lane: number = 0;
    speed: number = carStartSpeed;

    private image: HTMLImageElement;

    constructor(image: HTMLImageElement) {
        super();

        this.image = image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.drawImage(this.image, this.x, this.y);
    }

    stop(): void {
        this.speed = 0;
    }

    accelerate(): void {
        if (this.speed < carEndSpeed) this.speed += carAcceleration;
    }

    resetSpeed(): void {
        this.speed = carStartSpeed;
    }

    slowDown(): any {
        this.speed = (carStartSpeed + this.speed) / 2;
    }
}

export class Animation extends GameObject implements IPoolable {
    private image: HTMLImageElement | null = null;
    private rowCount: number = 1;
    private colCount: number = 1;

    private elapsed = 0;
    private currentFrame = 0;

    public isAnimating = true;

    setImage(image: HTMLImageElement, rowCount: number, colCount: number): void {
        this.image = image;
        this.rowCount = rowCount;
        this.colCount = colCount;

        this.width = this.image.width / this.colCount;
        this.height = this.image.height / this.rowCount;
    }

    update(dt: number): void {
        this.elapsed += dt;

        this.currentFrame = this.elapsed / 20;
        if (this.currentFrame < 0 || this.currentFrame >= this.rowCount * this.colCount) {
            this.isAnimating = false;
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        if (!this.isAnimating || !this.image) return;

        let animX = this.width * Math.floor(this.currentFrame % 5);
        let animY = this.height * Math.floor(this.currentFrame / 5);

        context.drawImage(this.image,
            animX, animY,
            this.width, this.height,
            this.x - this.width / 2, this.y - this.height / 2,
            this.width, this.height);
    }

    release(): void {
        throw new Error("Method not implemented.");
    }

    reset(): void {
        this.elapsed = 0;
        this.currentFrame = 0;
        this.isAnimating = true;
    }
}

export class Obstacle extends GameObject implements IPoolable {
    isVisible: boolean = true;
    hasColided: boolean = false;
    lane: number = 0;

    image: HTMLImageElement | null = null;

    animation: Animation | null = null;

    // tslint:disable-next-line no-empty
    onCollided: (o: Obstacle) => void = () => { };

    setImage(image: HTMLImageElement): void {
        this.image = image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    startAnimation(animation: Animation): void {
        if (this.animation) animation.release();

        this.animation = animation;
        this.update(0);
    }

    update(dt: number): void {
        if (this.animation) {
            this.animation.update(dt);
            this.animation.x = this.x + this.width / 2;
            this.animation.y = this.y + this.height / 2;

            if (!this.animation.isAnimating) {
                this.animation.release();
                this.animation = null;
            }
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        const spriteSize = 64;

        if (this.isVisible && this.image) {
            context.drawImage(this.image, this.x, this.y);
        }

        if (this.animation) {
            this.animation.draw(context);
        }
    }

    release(): void {
        throw new Error("Method not implemented.");
    }

    reset(): void {
        this.isVisible = true;
        this.hasColided = false;
    }
}

export class Menu extends GameObject {
    isVisible: boolean = false;

    draw(context: CanvasRenderingContext2D): void {
        if (!this.isVisible) return;

        let menuItemText = "New Game";
        context.font = "30px Arial";
        context.fillStyle = "#f00";
        context.textAlign = "center";
        context.strokeStyle = "#fff";
        context.fillText(menuItemText, this.x, this.y);
        context.strokeText(menuItemText, this.x, this.y);
    }
}

export class Hud extends GameObject {
    public score = 0;
    public lives = 0;

    draw(context: CanvasRenderingContext2D): void {
        context.font = "bold 14px Arial";
        context.fillStyle = "#000";
        context.textBaseline = "bottom";
        context.strokeStyle = "#000";

        context.textAlign = "left";
        context.fillText("Score: " + this.score, this.x, this.y + this.height);

        context.textAlign = "right";
        context.fillText("Cars: " + this.lives, this.x + this.width, this.y + this.height);
    }
}