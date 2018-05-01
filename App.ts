import { Resources } from "./Resources";
import { Input } from "./Input";
import { Display } from "./Display";

type ObstacleType = "wall" | "money" | "dirt";

interface IObstacle {
    colided: boolean;
    type: ObstacleType;
    lane: number;
    x: number;
    y: number;
    image: HTMLImageElement;
    animationStart?: number;
    animation?: string;
}

class App {
    public start(): void {
        var resources: Resources,
            input: Input,
            display: Display;

        var lastFrameTime;

        var score,
            lives;

        var roadY = .0;

        var minSpeed = 0.4;
        var acceleration = 0.001;

        var car = {
            x: 0,
            y: 0,
            lane: 0,
            speed: 0
        };

        var obstacles: IObstacle[] = [];
        var obstacleMinY = 1000;

        var startGame = function (): void {
            let carImage = resources.getImage("car");

            score = 0;
            lives = 3;
            car.speed = minSpeed;
            car.y = display.height - carImage.height - 20;

            lastFrameTime = +new Date;

            gameLoop();
        };

        var setUpInput = function (): void {
            input = new Input(display.canvas);
        };

        var loadResources = function (): void {
            resources = new Resources(startGame);
            resources.loadImage("car", "car.png");
            resources.loadImage("road", "road.jpg");
            resources.loadImage("wall", "wall.png");
            resources.loadImage("dirt", "dirt.png");
            resources.loadImage("money", "money.png");
            resources.loadImage("explosion", "explosion.png");
            resources.loadSound("explosion", "explosion.mp3");
        };

        var gameLoop = function (): void {
            window.requestAnimationFrame(gameLoop);

            var t = +new Date;
            var dt = t - lastFrameTime;

            drawFrame(t, dt);

            lastFrameTime = t;
        };

        var drawFrame = function (t: number, dt: number): void {

            display.context.clearRect(0, 0, display.width, display.height);

            drawRoad(dt);

            drawObstacles(t, dt);
            drawCar(dt);

            checkCollision(t);

            display.updateScore(score);
            display.updateLives(lives);

            if (lives <= 0) {
                car.speed = 0;
            } else {
                if (car.speed < 0.8) car.speed += acceleration;
            }
        };

        var drawObstacles = function (t: number, dt: number): void {
            let carImage = resources.getImage("car");

            var random = Math.random() * 200;

            if (random < obstacleMinY - carImage.height) {
                createObstacle();
            }

            obstacleMinY = 1000;

            var toRemove = [];
            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];

                drawObstacle(t, dt, obstacle);

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

        var playSound = function (sound: HTMLAudioElement): void {
            if (sound.canPlayType("audio/mp3") === "") return;
            if (navigator.userAgent.indexOf("hpwOS") >= 0) return;
            sound.play();
        };

        var checkCollision = function (t: number): void {
            let carImage = resources.getImage("car");

            for (var i = 0; i < obstacles.length; i++) {
                var obstacle = obstacles[i];

                if (!obstacle.colided && obstacle.lane === car.lane &&
                    (obstacle.y + obstacle.image.height > car.y) &&
                    (obstacle.y < car.y + carImage.height)) {

                    obstacle.colided = true;

                    if (obstacle.type === "wall") {
                        playSound(resources.getSound("explosion"));
                        obstacle.animationStart = t;
                        obstacle.animation = "explosion";
                        lives--;
                        car.speed = minSpeed;
                    } else if (obstacle.type === "dirt") {
                        car.speed = (minSpeed + car.speed) / 2;
                    } else if (obstacle.type === "money") {
                        score += 50;
                    }
                }
            }
        };

        var drawObstacle = function (t: number, dt: number, obstacle: IObstacle): void {
            obstacle.y += dt * car.speed;

            display.context.save();
            display.context.translate(obstacle.x, Math.round(obstacle.y));

            if (obstacle.animation) {
                var animDt = t - obstacle.animationStart;
                var animFrame = animDt / 20;
                if (animFrame >= 0 && animFrame < 25) {
                    var animX = 64 * Math.floor(animFrame % 5);
                    var animY = 64 * Math.floor(animFrame / 5);

                    let animationImage = resources.getImage(obstacle.animation);
                    display.context.drawImage(animationImage,
                        animX, animY,
                        64, 64,
                        obstacle.image.width / 2 - 32, obstacle.image.height / 2 - 32,
                        64, 64);
                }
            } else {
                display.context.drawImage(obstacle.image, 0, 0);
            }

            display.context.restore();
        };

        var createObstacle = function (): void {
            var lane = (Math.random() > 0.5) ? 0 : 1;

            var type;
            var typeRandom = Math.random();
            if (typeRandom < 0.1) {
                type = "dirt";
            } else if (typeRandom < 0.3) {
                type = "money";
            } else {
                type = "wall";
            }

            var obstacleImage = resources.getImage(type);
            var wallImage = resources.getImage("wall");
            var obstacle = {
                colided: false,
                type: type,
                x: laneToX(lane, wallImage.width),
                y: -obstacleImage.height,
                image: obstacleImage,
                lane: lane
            };
            obstacles.push(obstacle);
        };

        var drawRoad = function (dt: number): void {
            var roadImage = resources.getImage("road");

            roadY += dt * car.speed;

            roadY = roadY % roadImage.height;

            var y = Math.round(roadY);

            if (y > 0) {
                display.context.drawImage(roadImage,
                    0, roadImage.height - y,
                    roadImage.width, y,
                    (display.width - roadImage.width) / 2, 0,
                    roadImage.width, y);
            }

            var i = 0;
            while (true) {
                var height = Math.min(roadImage.height, display.height - (y + i * roadImage.height));

                if (height <= 0) break;

                display.context.drawImage(roadImage,
                    0, 0,
                    roadImage.width, height,
                    (display.width - roadImage.width) / 2, y + i * roadImage.height,
                    roadImage.width, height);

                i++;
            }
        };

        var laneToX = function (lane: number, width: number): number {
            var roadImage = resources.getImage("road");
            return (display.width - roadImage.width / 2) / 2 - width / 2 + lane * roadImage.width / 2;
        };

        function drawCar(dt: number): void {
            let carImage = resources.getImage("car");

            if (input.laneChangeRequested >= 0) {
                car.lane = input.laneChangeRequested;
                car.x = laneToX(car.lane, carImage.width);
            }

            display.context.save();
            display.context.globalAlpha = 1;
            display.context.translate(car.x, car.y);
            display.context.drawImage(carImage, 0, 0);
            display.context.restore();
        }

        display = new Display();
        setUpInput();
        loadResources();
    }
}

var app = new App();
app.start();
