import { Resources } from "./Resources";
import { Input } from "./Input";
import { Display } from "./Display";
import { Road, Car, Obstacle, ObstacleType } from "./GameObjects";

class App {
    public start(): void {
        var resources: Resources,
            input: Input,
            display: Display;

        var score,
            lives;

        var road: Road;
        var car: Car;
        var obstacles: Obstacle[] = [];

        var lastFrameTime;
        var obstacleMinY = 1000;

        var startNewGame = function (): void {
            score = 0;
            lives = 3;

            road = new Road(resources.getImage("road"), display.height);
            car = new Car(resources.getImage("car"));

            lastFrameTime = null;
            requestAnimationFrame(gameLoop);
        };

        var loadResources = function (): void {
            resources = new Resources(startNewGame);
            resources.loadImage("car", "car.png");
            resources.loadImage("road", "road.jpg");
            resources.loadImage("wall", "wall.png");
            resources.loadImage("dirt", "dirt.png");
            resources.loadImage("money", "money.png");
            resources.loadImage("explosion", "explosion.png");
            resources.loadSound("explosion", "explosion.mp3");
        };

        var gameLoop = function (t: number): void {
            requestAnimationFrame(gameLoop);

            if (!lastFrameTime) lastFrameTime = t;

            var dt = t - lastFrameTime;

            updateObjects(t, dt);

            drawFrame();

            lastFrameTime = t;
        };

        var updateObjects = function (t: number, dt: number): void {
            road.y += dt * car.speed;

            if (input.laneChangeRequested >= 0) {
                car.lane = input.laneChangeRequested;
            }
            car.x = laneToX(car.lane, car.width);
            car.y = display.height - car.height - 20;

            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];
                obstacle.t = t;
                obstacle.y += dt * car.speed;
            }

            generateObstacles();
            checkCollisions();

            display.updateScore(score);
            display.updateLives(lives);

            if (lives <= 0) {
                car.stop();
            } else {
                car.accelerate();
            }
        };

        var drawFrame = function (): void {

            display.clear();

            road.draw(display.context);

            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];
                obstacle.draw(display.context);
            }

            car.draw(display.context);
        };

        var checkCollisions = function (): void {
            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];

                if (!obstacle.colided && obstacle.lane === car.lane &&
                    (obstacle.y + obstacle.image.height > car.y) &&
                    (obstacle.y < car.y + car.height)) {

                    obstacle.colided = true;

                    if (obstacle.type === ObstacleType.wall) {
                        resources.playSound("explosion");
                        obstacle.startAnimation(resources.getImage("explosion"));
                        lives--;
                        car.resetSpeed();
                    } else if (obstacle.type === ObstacleType.dirt) {
                        car.slowDown();
                    } else if (obstacle.type === ObstacleType.money) {
                        score += 50;
                    }
                }
            }
        };

        var generateObstacles = function (): void {
            var random = Math.random() * 200;

            if (random < obstacleMinY - car.height) {
                createObstacle();
            }

            obstacleMinY = 1000;

            var toRemove = [];
            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];

                obstacleMinY = Math.min(obstacleMinY, obstacle.y - obstacle.image.height);
                if (obstacle.y > display.height) {
                    toRemove.push(i);
                }
            }

            score += toRemove.length * 10;

            removeObstacles(toRemove);
        };

        var removeObstacles = function (indexes: number[]): void {
            indexes.reverse();
            for (var i = 0; i < indexes.length; i++) {
                obstacles.splice(i, 1);
            }
        };

        var createObstacle = function (): void {
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

            var obstacle = new Obstacle(type, resources.getImage(type));
            obstacle.lane = lane;
            obstacle.x = laneToX(lane, obstacle.width);
            obstacle.y = -obstacle.height;

            obstacles.push(obstacle);
        };

        var laneToX = function (lane: number, width: number): number {
            return (display.width * (0.5 + lane) - width) / 2;
        };

        display = new Display();
        input = new Input(display.canvas);
        loadResources();
    }
}

var app = new App();
app.start();
