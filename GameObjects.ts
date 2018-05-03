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

    public abstract draw(context: CanvasRenderingContext2D): void;
}

const carStartSpeed = 0.4;
const carEndSpeed = 1.0;
const carAcceleration = 0.00075;

export class Road extends GameObject {
    private image: HTMLImageElement;

    constructor(image: HTMLImageElement, height: number) {
        super();

        this.image = image;
        this.width = this.image.width;
        this.height = height;
    }

    draw(context: CanvasRenderingContext2D): void {
        this.y = this.y % this.image.height;

        if (this.y > 0) {
            context.drawImage(this.image,
                0, this.image.height - this.y,
                this.image.width, this.y,
                this.x, 0,
                this.image.width, this.y);
        }

        var i = 0;
        while (true) {
            var height = Math.min(this.image.height, this.height - (this.y + i * this.image.height));

            if (height <= 0) break;

            context.drawImage(this.image,
                0, 0,
                this.image.width, height,
                this.x, this.y + i * this.image.height,
                this.image.width, height);

            i++;
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

export class Animation extends GameObject {
    private readonly image: HTMLImageElement;
    private readonly rowCount: number;
    private readonly colCount: number;

    private elapsed = 0;
    private currentFrame = 0;

    public isAnimating = true;

    constructor(image: HTMLImageElement, rowCount: number, colCount: number) {
        super();

        this.image = image;
        this.rowCount = rowCount;
        this.colCount = colCount;

        this.width = this.image.width / this.colCount;
        this.height = this.image.height / this.rowCount;
    }

    update(dt: number): void {
        this.elapsed += dt;

        this.currentFrame = this.elapsed / 20;
        if (this.currentFrame < 0 && this.currentFrame >= this.rowCount * this.colCount) {
            this.isAnimating = false;
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        if (!this.isAnimating) return;

        var animX = this.width * Math.floor(this.currentFrame % 5);
        var animY = this.height * Math.floor(this.currentFrame / 5);

        context.drawImage(this.image,
            animX, animY,
            this.width, this.height,
            this.x - this.width / 2, this.y - this.height / 2,
            this.width, this.height);
    }
}

export class Obstacle extends GameObject {
    colided: boolean = false;
    type: ObstacleType;
    lane: number = 0;

    image: HTMLImageElement;

    animation: Animation | null = null;

    constructor(type: ObstacleType, image: HTMLImageElement) {
        super();

        this.type = type;
        this.image = image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    startAnimation(animation: Animation): void {
        this.animation = animation;
        this.animation.x = this.x + this.width / 2;
        this.animation.y = this.y + this.height / 2;
    }

    update(dt: number): void {
        if (this.animation) {
            this.animation.update(dt);
            this.animation.x = this.x + this.width / 2;
            this.animation.y = this.y + this.height / 2;
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        const spriteSize = 64;

        if (!this.colided || this.type === ObstacleType.dirt) {
            context.drawImage(this.image, this.x, this.y);
        }

        if (this.animation) {
            if (this.animation.isAnimating) {
                this.animation.draw(context);
            } else {
                this.animation = null;
            }
        }
    }
}