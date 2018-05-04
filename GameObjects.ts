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

    isDisposed = false;

    abstract draw(context: CanvasRenderingContext2D): void;

    reset(): void {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.isDisposed = false;
    }

    // tslint:disable-next-line no-empty
    dispose: () => void = () => { };
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

    reset(): void {
        super.reset();

        this.elapsed = 0;
        this.currentFrame = 0;
        this.isAnimating = true;
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
    isVisible: boolean = true;
    hasColided: boolean = false;
    lane: number = 0;

    image: HTMLImageElement | null = null;

    animation: Animation | null = null;

    // tslint:disable-next-line no-empty
    onCollided: (o: Obstacle) => void = () => { };

    reset(): void {
        super.reset();

        this.isVisible = true;
        this.hasColided = false;
        this.animation = null;
    }

    setImage(image: HTMLImageElement): void {
        this.image = image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    startAnimation(animation: Animation): void {
        this.animation = animation;
        this.update(0);
    }

    update(dt: number): void {
        if (this.animation) {
            this.animation.update(dt);
            this.animation.x = this.x + this.width / 2;
            this.animation.y = this.y + this.height / 2;

            if (!this.animation.isAnimating) {
                this.animation.dispose();
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
}

export class Menu extends GameObject {
    isVisible: boolean = false;

    draw(context: CanvasRenderingContext2D): void {
        if (!this.isVisible) return;

        var menuItemText = "New Game";
        context.font = "30px Arial";
        context.fillStyle = "#f00";
        context.textAlign = "center";
        context.strokeStyle = "#fff";
        context.fillText(menuItemText, this.x, this.y);
        context.strokeText(menuItemText, this.x, this.y);
    }
}