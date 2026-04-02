import { Vector } from "/vector.js";

let canvas;
let context;
let request;

const FPS = 60;
const INTERVAL = 1000 / FPS;
let last = Date.now();

let plr = {
    x: 100,
    y: 100,
    moving_up: false,
    moving_down: false,
    moving_left: false,
    moving_right: false,
    speed: 10,
    size: 25
};

document.addEventListener("DOMContentLoaded", init, false)

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    window.addEventListener("keydown", press, false);
    window.addEventListener("keyup", unpress, false);
    draw()
}

function draw() {
    request = window.requestAnimationFrame(draw)
    let current = Date.now();
    let elapsed = current - last;
    if (elapsed <= INTERVAL) { return; }
    last = current - (elapsed % INTERVAL);

    calculate_movement();

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "red";
    context.fillRect(plr.x, plr.y, plr.size, plr.size);
}

function calculate_movement() {
    let vector = new Vector();
    if (plr.moving_up) { vector.y--; }
    if (plr.moving_right) { vector.x++; }
    if (plr.moving_down) { vector.y++; }
    if (plr.moving_left) { vector.x--; }

    if (vector.magnitude !== 0) {
        vector.set_length(plr.speed);
    }

    plr.x += vector.x;
    plr.y += vector.y;
}

function press(event) {
    let key = event.key;

    switch (key) {
        case "w":
        case "ArrowUp":
            plr.moving_up = true;
            break;
        
        case "a":
        case "ArrowLeft":
            plr.moving_left = true;
            break;
        
        case "s":
        case "ArrowDown":
            plr.moving_down = true;
            break;
        
        case "d":
        case "ArrowRight":
            plr.moving_right = true;
            break;
    }
}

function unpress(event) {
    let key = event.key;
    switch (key) {
        case "w":
        case "ArrowUp":
            plr.moving_up = false;
            break;
        
        case "a":
        case "ArrowLeft":
            plr.moving_left = false;
            break;
        
        case "s":
        case "ArrowDown":
            plr.moving_down = false;
            break;
        
        case "d":
        case "ArrowRight":
            plr.moving_right = false;
            break;
    }
}