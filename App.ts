﻿import {ResourceManager} from "./ResourceManager";

(function () {
    var App = (<any>window).App = { start: null };

    var keyCodes = {
        up: 38,
        down: 40,
        left: 37,
        right: 39
    };

    App.start = function () {
        var scoreEl, livesEl, canvasEl, context;

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
            speed: 0,
            immunity: false
        };

        var keysDown = {};

        window.onkeydown = function (e) {
            keysDown[e.keyCode] = true;
        };

        window.onkeyup = function (e) {
            keysDown[e.keyCode] = false;
        };

        scoreEl = document.getElementById("score");
        livesEl = document.getElementById("lives");

        canvasEl = document.getElementById("canvas");
        context = canvasEl.getContext("2d");

        var hasTouch = "ontouchstart" in document.documentElement;

        if (hasTouch) {
            canvasEl.ontouchstart = function (e) {
                e = e.touches[0];
                var x = e.pageX - canvasEl.offsetLeft;
                if (x < canvasEl.width / 2) car.lane = 0;
                else car.lane = 1;
            };
        } else {
            canvasEl.onmousedown = function (e) {
                var x = e.pageX - canvasEl.offsetLeft;
                if (x < canvasEl.width / 2) car.lane = 0;
                else car.lane = 1;
            };
        }

        var resources;
        var frameCount = 0;
        var startTime;

        var start = function () {
            let carImage = resources.getImage("car");

            score = 0;
            lives = 3;
            car.speed = minSpeed;
            car.y = canvasEl.height - carImage.height - 20;

            startTime = lastFrameTime = +new Date;

            gameLoop();
        };

        resources = new ResourceManager(start);
        resources.loadImage("car", "car.png");
        resources.loadImage("road", "road.jpg");
        resources.loadImage("wall", "wall.png");
        resources.loadImage("dirt", "dirt.png");
        resources.loadImage("money", "money.png");
        resources.loadImage("explosion", "explosion.png");
        resources.loadSound("explosion", "explosion.mp3");

        var totalTime = 0;

        var gameLoop = function () {
            window.requestAnimationFrame(gameLoop);

            var t = +new Date;
            var dt = t - lastFrameTime;

            drawFrame(t, dt);

            lastFrameTime = t;

            frameCount++;
            var milisSinceStart = t - startTime;

            var frameTime = (+new Date - t);
            totalTime += frameTime;
        };

        var drawFrame = function (t, dt) {

            context.clearRect(0, 0, canvasEl.width, canvasEl.height);

            drawRoad(dt);

            drawObstacles(t, dt);
            drawCar(dt);

            checkCollision(t);

            scoreEl.innerHTML = score;
            livesEl.innerHTML = lives;

            if (lives <= 0) {
                car.speed = 0;
            } else {
                if (car.speed < 0.8) car.speed += acceleration;
            }
        };

        var obstacles = [];
        var obstacleMinY = 1000;
        var drawObstacles = function (t, dt) {
            let carImage = resources.getImage("car");

            var random = Math.random() * 200;

            if (random < obstacleMinY - carImage.height) {
                createObstacle();
            }

            obstacleMinY = 1000;

            var toRemove = [];
            for (var i in obstacles) {
                var obstacle = obstacles[i];

                drawObstacle(t, dt, obstacle);

                obstacleMinY = Math.min(obstacleMinY, obstacle.y - obstacle.image.height);

                if (obstacle.y > canvasEl.height) {
                    toRemove.push(i);
                }
            }

            score += toRemove.length * 10;

            removeObstacles(toRemove);
        };

        var removeObstacles = function (indexes) {
            indexes.reverse();
            for (var j = 0; j < indexes.length; j++) {
                obstacles.splice(j, 1);
            }
        };

        var playSound = function (sound) {
            if (sound.canPlayType("audio/mp3") === "") return;
            if (navigator.userAgent.indexOf("hpwOS") >= 0) return;

            sound.src = "sounds/explosion.mp3";
            sound.play();
        };

        var checkCollision = function (t) {
            let carImage = resources.getImage("car");

            for (var i in obstacles) {
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

        var drawObstacle = function (t, dt, obstacle) {
            obstacle.y += dt * car.speed;

            context.save();
            context.translate(obstacle.x, Math.round(obstacle.y));

            if (obstacle.animation) {
                var animDt = t - obstacle.animationStart;
                var animFrame = animDt / 20;
                if (animFrame >= 0 && animFrame < 25) {
                    var animX = 64 * Math.floor(animFrame % 5);
                    var animY = 64 * Math.floor(animFrame / 5);

                    let animationImage = resources.getImage(obstacle.animation);
                    context.drawImage(animationImage,
                        animX, animY,
                        64, 64,
                        obstacle.image.width / 2 - 32, obstacle.image.height / 2 - 32,
                        64, 64);
                }
            } else {
                context.drawImage(obstacle.image, 0, 0);
            }

            context.restore();
        };

        var createObstacle = function () {
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

        var drawRoad = function (deltaT) {
            var roadImage = resources.getImage("road");

            roadY += deltaT * car.speed;

            roadY = roadY % roadImage.height;

            var y = Math.round(roadY);

            if (y > 0) {
                context.drawImage(roadImage,
                    0, roadImage.height - y,
                    roadImage.width, y,
                    (canvasEl.width - roadImage.width) / 2, 0,
                    roadImage.width, y);
            }

            var i = 0;
            while (true) {
                var height = Math.min(roadImage.height, canvasEl.height - (y + i * roadImage.height));

                if (height <= 0) break;

                context.drawImage(roadImage,
                    0, 0,
                    roadImage.width, height,
                    (canvasEl.width - roadImage.width) / 2, y + i * roadImage.height,
                    roadImage.width, height);

                i++;
            }
        };

        var laneToX = function (lane, width) {
            var roadImage = resources.getImage("road");
            return (canvasEl.width - roadImage.width / 2) / 2 - width / 2 + lane * roadImage.width / 2;
        };

        function drawCar(dt) {
            let carImage = resources.getImage("car");

            if (keysDown[keyCodes.left]) car.lane = 0;
            if (keysDown[keyCodes.right]) car.lane = 1;

            car.x = laneToX(car.lane, carImage.width);

            context.save();
            context.globalAlpha = 1;
            context.translate(car.x, car.y);
            context.drawImage(carImage, 0, 0);
            context.restore();
        }
    };

    App.start();
})();