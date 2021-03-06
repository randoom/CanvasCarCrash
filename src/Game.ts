import { Resources } from "./Resources";
import { Input, KeyCodes } from "./Input";
import { Display } from "./Display";
import { ObjectPool } from "./ObjectPool";
import { Road, Car, Obstacle, Animation, Hud, Menu } from "./GameObjects";

class Game {
    resources: Resources;
    input: Input;
    display: Display;

    menu: Menu;
    hud: Hud;
    road: Road;
    car: Car;
    obstacles: Obstacle[] = [];

    lastFrameTime: number | null = null;
    obstacleMinY = 1000;

    constructor(resources: Resources) {
        this.resources = resources;
        this.display = new Display();
        this.input = new Input(this.display.canvas);

        this.menu = new Menu();
        this.menu.x = this.display.width / 2;
        this.menu.y = this.display.height / 2;

        this.hud = new Hud();
        this.hud.width = this.display.width;
        this.hud.height = 20;

        this.road = new Road(this.resources.getImage("road"), this.display.height - this.hud.height);
        this.road.y = this.hud.height;
        this.car = new Car(this.resources.getImage("car"));
    }

    startNewGame(): void {
        this.hud.score = 0;
        this.hud.lives = 3;

        this.car.resetSpeed();
        this.car.lane = 0;

        for (let i = 0; i < this.obstacles.length; i++) {
            ObjectPool.release(this.obstacles[i]);
        }
        this.obstacles.length = 0;

        this.lastFrameTime = null;
    }

    bindedGameLoop: (t: number) => void = this.gameLoop.bind(this);

    gameLoop(t: number): void {
        requestAnimationFrame(this.bindedGameLoop);

        if (!this.lastFrameTime) this.lastFrameTime = t;
        let dt = t - this.lastFrameTime;

        this.update(dt);

        this.draw();

        this.lastFrameTime = t;
    }

    update(dt: number): void {
        if (this.hud.lives > 0) {
            if (this.input.laneChangeRequested >= 0) {
                this.car.lane = this.input.laneChangeRequested;
            }
            this.car.x = this.laneToX(this.car.lane, this.car.width);
            this.car.y = this.road.y + this.road.height - this.car.height * 1.25;
            this.car.accelerate();
        } else {
            if (this.input.isKeyDown(KeyCodes.enter)) {
                this.startNewGame();
                this.menu.isVisible = false;
            }
        }

        this.road.distance += dt * this.car.speed;

        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];
            obstacle.update(dt);
            obstacle.y += dt * this.car.speed;
        }

        this.generateObstacles();

        this.checkCollisions();
    }

    draw(): void {
        this.display.clear();

        this.display.context.save();
        this.display.context.beginPath();
        this.display.context.rect(this.road.x, this.road.y, this.road.width, this.road.height);
        this.display.context.clip();

        this.road.draw(this.display.context);

        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];
            obstacle.draw(this.display.context);
        }

        this.car.draw(this.display.context);

        this.display.context.restore();

        this.menu.draw(this.display.context);

        this.hud.draw(this.display.context);
    }

    checkCollisions(): void {
        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];

            if (!obstacle.hasColided && obstacle.lane === this.car.lane &&
                (obstacle.y + obstacle.height > this.car.y) &&
                (obstacle.y < this.car.y + this.car.height)) {

                obstacle.hasColided = true;
                obstacle.onCollided(this, obstacle);
            }
        }
    }

    generateObstacles(): void {
        let random = Math.random() * 200;

        if (random < this.obstacleMinY - this.car.height) {
            this.createObstacle();
        }

        this.obstacleMinY = 1000;

        let toRemove = [];
        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];

            this.obstacleMinY = Math.min(this.obstacleMinY, obstacle.y - obstacle.height);
            if (obstacle.y > this.road.y + this.road.height) {
                toRemove.push(i);
            }
        }

        this.hud.score += toRemove.length * 10;

        this.removeObstacles(toRemove);
    }

    removeObstacles(indexes: number[]): void {
        indexes.reverse();
        for (let i = 0; i < indexes.length; i++) {
            let obstacle = this.obstacles.splice(indexes[i], 1)[0];
            ObjectPool.release(obstacle);
            // obstacle.reset();
        }
    }

    createObstacle(): void {
        let obstacle = ObjectPool.get(Obstacle);

        let typeRandom = Math.random();
        if (typeRandom < 0.1) {
            obstacle.setImage(this.resources.getImage("dirt"));
            obstacle.onCollided = Game.onDirtCollided;
        } else if (typeRandom < 0.3) {
            obstacle.setImage(this.resources.getImage("money"));
            obstacle.onCollided = Game.onMoneyCollided;
        } else {
            obstacle.setImage(this.resources.getImage("wall"));
            obstacle.onCollided = Game.onWallCollided;
        }

        obstacle.lane = Math.random() > 0.5 ? 0 : 1;
        obstacle.x = this.laneToX(obstacle.lane, obstacle.width);
        obstacle.y = this.road.y - obstacle.height;

        this.obstacles.push(obstacle);
    }

    static onWallCollided(game: Game, obstacle: Obstacle): void {
        obstacle.isVisible = false;
        game.resources.playSound("explosion");

        let animation = ObjectPool.get(Animation);
        animation.setImage(game.resources.getImage("explosion"), 5, 5);
        obstacle.startAnimation(animation);

        game.hud.lives--;
        if (game.hud.lives > 0) {
            game.car.resetSpeed();
        } else {
            game.car.stop();
            game.menu.isVisible = true;
        }
    }

    static onDirtCollided(game: Game): void {
        game.car.slowDown();
    }

    static onMoneyCollided(game: Game, obstacle: Obstacle): void {
        obstacle.isVisible = false;
        game.hud.score += 50;
    }

    laneToX(lane: number, width: number): number {
        return (this.road.width * (0.5 + lane) - width) / 2;
    }

    static loadResources(resources: Resources): void {
        resources.loadImage("car", "car.png");
        resources.loadImage("road", "road.jpg");
        resources.loadImage("wall", "wall.png");
        resources.loadImage("dirt", "dirt.png");
        resources.loadImage("money", "money.png");
        resources.loadImage("explosion", "explosion.png");
        resources.loadSound("explosion", "explosion.mp3");
    }

    static init(): void {
        let resources = new Resources(() => {
            let game = new Game(resources);
            game.startNewGame();
            requestAnimationFrame(game.bindedGameLoop);
        });
        this.loadResources(resources);
    }
}

Game.init();

