import { Vector } from "/vector.js";
import { Player } from "/player.js";

let canvas;
let context;
let request;

const FPS = 60;
const INTERVAL = 1000 / FPS;
let last = Date.now();

let plr;
let actions = {
    moving_up: false,
    moving_down: false,
    moving_left: false,
    moving_right: false,
    mouse: new Vector()
};

document.addEventListener("DOMContentLoaded", init, false)
document.addEventListener("mousemove", mousemove, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    plr = new Player(100, 100, 25, 25, 10);
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
    plr.draw(context);
}

function calculate_movement() {
    let old = plr.coords;
    let displacement = new Vector();
    if (actions.moving_up) { displacement.y--; }
    if (actions.moving_down) { displacement.y++; }
    if (actions.moving_left) { displacement.x--; }
    if (actions.moving_right) { displacement.x++; }

    if (displacement.magnitude !== 0) {
        displacement.set_length(plr.speed);
    }

    // plr.x += displacement.x;

    // if (is_colliding(plr, wall)) {
    //     plr.x = (old.x <= wall.x) ? (wall.x - plr.width) : (wall.x + wall.width);
    // }

    // plr.y += displacement.y;

    // if (is_colliding(plr, wall)) {
    //     plr.y = (old.y <= wall.y) ? (wall.y - plr.height) : (wall.y + wall.height);
    // }

    plr.set_facing(actions.mouse);
}

function is_colliding(victim, perp) {
    return (victim.x + victim.width) > perp.x &&
           victim.x < (perp.x + perp.width) &&
           (victim.y + victim.height) > perp.y &&
           victim.y < (perp.y + perp.height);
}

function press(event) {
    let key = event.key;

    switch (key) {
        case "w":
        case "ArrowUp":
            actions.moving_up = true;
            break;
        
        case "a":
        case "ArrowLeft":
            actions.moving_left = true;
            break;
        
        case "s":
        case "ArrowDown":
            actions.moving_down = true;
            break;
        
        case "d":
        case "ArrowRight":
            actions.moving_right = true;
            break;
    }
}

function unpress(event) {
    let key = event.key;
    switch (key) {
        case "w":
        case "ArrowUp":
            actions.moving_up = false;
            break;
        
        case "a":
        case "ArrowLeft":
            actions.moving_left = false;
            break;
        
        case "s":
        case "ArrowDown":
            actions.moving_down = false;
            break;
        
        case "d":
        case "ArrowRight":
            actions.moving_right = false; 
            break;
    }
}

function mousemove(event) {
    if (plr === null || plr === undefined) { return; }
    actions.mouse.x = event.clientX;
    actions.mouse.y = event.clientY;
    plr.set_facing(actions.mouse);
}