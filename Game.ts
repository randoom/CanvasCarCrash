import { Resources } from "./Resources";
import { Input, KeyCodes } from "./Input";
import { Display } from "./Display";
import { ObjectPool } from "./ObjectPool";
import { Road, Car, Obstacle, ObstacleType, Animation, Hud, Menu } from "./GameObjects";

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

        this.obstacles = [];

        this.lastFrameTime = null;
    }

    gameLoop(t: number): void {
        requestAnimationFrame((t) => this.gameLoop(t));

        if (!this.lastFrameTime) this.lastFrameTime = t;
        var dt = t - this.lastFrameTime;

        this.updateObjects(t, dt);
        this.checkCollisions();

        this.drawFrame();

        this.lastFrameTime = t;
    }

    updateObjects(t: number, dt: number): void {
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

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.update(dt);
            obstacle.y += dt * this.car.speed;
        }

        this.generateObstacles();
    }

    drawFrame(): void {
        this.display.clear();

        this.display.context.save();
        this.display.context.beginPath();
        this.display.context.rect(this.road.x, this.road.y, this.road.width, this.road.height);
        this.display.context.clip();

        this.road.draw(this.display.context);

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.draw(this.display.context);
        }

        this.car.draw(this.display.context);

        this.menu.draw(this.display.context);

        this.display.context.restore();

        this.hud.draw(this.display.context);
    }

    checkCollisions(): void {
        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];

            if (!obstacle.hasColided && obstacle.lane === this.car.lane &&
                (obstacle.y + obstacle.height > this.car.y) &&
                (obstacle.y < this.car.y + this.car.height)) {

                obstacle.hasColided = true;
                obstacle.onCollided(obstacle);
            }
        }
    }

    generateObstacles(): void {
        var random = Math.random() * 200;

        if (random < this.obstacleMinY - this.car.height) {
            this.createObstacle();
        }

        this.obstacleMinY = 1000;

        var toRemove = [];
        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];

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
        for (var i = 0; i < indexes.length; i++) {
            var obstacle = this.obstacles.splice(indexes[i], 1)[0];
            obstacle.release();
        }
    }

    createObstacle(): void {
        var image: HTMLImageElement;
        var onCollided: (this: Game, o: Obstacle) => void;
        var typeRandom = Math.random();
        if (typeRandom < 0.1) {
            image = this.resources.getImage("dirt");
            onCollided = (o: Obstacle) => {
                this.car.slowDown();
            };
        } else if (typeRandom < 0.3) {
            image = this.resources.getImage("money");
            onCollided = (o: Obstacle) => {
                o.isVisible = false;
                this.hud.score += 50;
            };
        } else {
            image = this.resources.getImage("wall");
            onCollided = (o: Obstacle) => {
                o.isVisible = false;
                this.resources.playSound("explosion");

                var animation = ObjectPool.get(Animation);
                animation.setImage(this.resources.getImage("explosion"), 5, 5);
                o.startAnimation(animation);

                this.hud.lives--;
                if (this.hud.lives > 0) {
                    this.car.resetSpeed();
                } else {
                    this.car.stop();
                    this.menu.isVisible = true;
                }
            };
        }

        var lane = Math.random() > 0.5 ? 0 : 1;

        var obstacle = ObjectPool.get(Obstacle);
        obstacle.reset();
        obstacle.setImage(image);
        obstacle.onCollided = onCollided;
        obstacle.lane = lane;
        obstacle.x = this.laneToX(lane, obstacle.width);
        obstacle.y = this.road.y - obstacle.height;

        this.obstacles.push(obstacle);
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
        var resources = new Resources(() => {
            var game = new Game(resources);
            game.startNewGame();
            requestAnimationFrame((t) => game.gameLoop(t));
        });
        this.loadResources(resources);
    }
}

Game.init();

