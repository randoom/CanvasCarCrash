import { Resources } from "./Resources";
import { Input } from "./Input";
import { Display } from "./Display";
import { Road, Car, Obstacle, ObstacleType, Animation, Menu } from "./GameObjects";

class Game {
    resources: Resources;
    input: Input;
    display: Display;

    score: number = 0;
    lives: number = 0;

    menu: Menu;
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

        this.road = new Road(this.resources.getImage("road"), this.display.height);
        this.car = new Car(this.resources.getImage("car"));
    }

    startNewGame(): void {
        this.score = 0;
        this.lives = 3;

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
        this.updateHUD();

        this.lastFrameTime = t;
    }

    updateHUD(): void {
        this.display.updateScore(this.score);
        this.display.updateLives(this.lives);
    }

    updateObjects(t: number, dt: number): void {
        if (this.lives > 0) {
            if (this.input.laneChangeRequested >= 0) {
                this.car.lane = this.input.laneChangeRequested;
            }
            this.car.x = this.laneToX(this.car.lane, this.car.width);
            this.car.y = this.display.height - this.car.height - 20;
            this.car.accelerate();
        } else {
            if (this.input.laneChangeRequested >= 0) {
                this.startNewGame();
                this.menu.isVisible = false;
            }
        }

        this.road.y += dt * this.car.speed;

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.update(dt);
            obstacle.y += dt * this.car.speed;
        }

        this.generateObstacles();
    }

    drawFrame(): void {
        this.display.clear();

        this.road.draw(this.display.context);

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.draw(this.display.context);
        }

        this.car.draw(this.display.context);

        this.menu.draw(this.display.context);
    }

    checkCollisions(): void {
        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];

            if (!obstacle.colided && obstacle.lane === this.car.lane &&
                (obstacle.y + obstacle.image.height > this.car.y) &&
                (obstacle.y < this.car.y + this.car.height)) {

                obstacle.colided = true;

                if (obstacle.type === ObstacleType.wall) {
                    this.resources.playSound("explosion");
                    obstacle.startAnimation(new Animation(this.resources.getImage("explosion"), 5, 5));
                    this.lives--;
                    if (this.lives > 0) {
                        this.car.resetSpeed();
                    } else {
                        this.car.stop();
                        this.menu.isVisible = true;
                    }
                } else if (obstacle.type === ObstacleType.dirt) {
                    this.car.slowDown();
                } else if (obstacle.type === ObstacleType.money) {
                    this.score += 50;
                }
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

            this.obstacleMinY = Math.min(this.obstacleMinY, obstacle.y - obstacle.image.height);
            if (obstacle.y > this.display.height) {
                toRemove.push(i);
            }
        }

        this.score += toRemove.length * 10;

        this.removeObstacles(toRemove);
    }

    removeObstacles(indexes: number[]): void {
        indexes.reverse();
        for (var i = 0; i < indexes.length; i++) {
            this.obstacles.splice(i, 1);
        }
    }

    createObstacle(): void {
        var lane = Math.random() > 0.5 ? 0 : 1;

        var type: ObstacleType;
        var typeRandom = Math.random();
        if (typeRandom < 0.1) {
            type = ObstacleType.dirt;
        } else if (typeRandom < 0.3) {
            type = ObstacleType.money;
        } else {
            type = ObstacleType.wall;
        }

        var obstacle = new Obstacle(type, this.resources.getImage(type));
        obstacle.lane = lane;
        obstacle.x = this.laneToX(lane, obstacle.width);
        obstacle.y = -obstacle.height;

        this.obstacles.push(obstacle);
    }

    laneToX(lane: number, width: number): number {
        return (this.display.width * (0.5 + lane) - width) / 2;
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

