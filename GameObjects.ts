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

export class Obstacle extends GameObject {
    colided: boolean = false;
    type: ObstacleType;
    lane: number = 0;

    image: HTMLImageElement;

    private animationImage: HTMLImageElement | null = null;
    private animationElapsed: number = 0;

    constructor(type: ObstacleType, image: HTMLImageElement) {
        super();

        this.type = type;
        this.image = image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    startAnimation(animationImage: HTMLImageElement): void {
        this.animationImage = animationImage;
        this.animationElapsed = 0;
    }

    update(dt: number): void {
        if (this.animationImage) {
            this.animationElapsed += dt;
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        const spriteSize = 64;

        if (!this.colided || this.type === ObstacleType.dirt) {
            context.drawImage(this.image, this.x, this.y);
        }

        if (this.animationImage) {
            var animFrame = this.animationElapsed / 20;
            if (animFrame >= 0 && animFrame < 25) {
                var animX = spriteSize * Math.floor(animFrame % 5);
                var animY = spriteSize * Math.floor(animFrame / 5);

                context.drawImage(this.animationImage,
                    animX, animY,
                    spriteSize, spriteSize,
                    this.x + (this.width - spriteSize) / 2, this.y + (this.height - spriteSize) / 2,
                    spriteSize, spriteSize);
            } else {
                this.animationImage = null;
            }
        }
    }
}