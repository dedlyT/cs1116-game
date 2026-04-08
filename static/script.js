import { Vector } from "./vector.js";
import { Player } from "./player.js";
import { LEVELS, TILES } from "./levels.js";

let canvas;
let context;
let request;

const FPS = 30;
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
    plr = new Player(100, 100, 25, 25, 0.15);
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

    calculate_movement(elapsed);

    context.clearRect(0, 0, canvas.width, canvas.height);
    LEVELS.first.draw(context);
    plr.draw(context);
}

function calculate_movement(dT) {
    let old = plr.coords;
    let displacement = new Vector();
    if (actions.moving_up) { displacement.y--; }
    if (actions.moving_down) { displacement.y++; }
    if (actions.moving_left) { displacement.x--; }
    if (actions.moving_right) { displacement.x++; }

    if (displacement.magnitude !== 0) {
        displacement.set_length(plr.speed);
    }

    let adj;
    plr.x += displacement.x * dT;

    adj = get_adjacent_tiles(plr.coords, LEVELS.first);
    for (let [r,c] of adj) {
        if (TILES[LEVELS.first.matrix[r][c]].collidable === undefined) { continue; }
        let x = r*25;
        let y = c*25;
        if (is_colliding(plr, {x:x, y:y, width:25, height:25})) {
            plr.x = (old.x <= x) ? (x - plr.width) : (x + 25);
        }
    }

    plr.y += displacement.y * dT;

    adj = get_adjacent_tiles(plr.coords, LEVELS.first);
    for (let [r,c] of adj) {
        if (TILES[LEVELS.first.matrix[r][c]].collidable === undefined) { continue; }
        let x = r*25;
        let y = c*25;
        if (is_colliding(plr, {x:x, y:y, width:25, height:25})) {
            plr.y = (old.y <= y) ? (y - plr.height) : (y + 25);
        }
    }

    plr.set_facing(actions.mouse);
}

/*EXAMPLE:
- - - - -
A B C - -
D O E - -
F G H - -
pos is at O
returns: [[Ar,Ac], [Br,Bc], [Cr, Cc], [Dr, Dc], [Or, Oc], ... ], 
        where LEVELS[Ar][Ac] == A, LEVELS[Br][Bc] == B, etc. etc.
NOTE: if the coords of a nearby tile goes outside the range of the level matrix, it is discluded from the result.
*/
function get_adjacent_tiles(pos, level) {
    let tile_x = Math.floor(pos.x / 25);
    let tile_y = Math.floor(pos.y / 25);
    let res = [];
    for (let r=(tile_x-1); r<=(tile_x+1); r++) {
        if (r < 0 || r >= level.height) { continue; }
        for(let c=(tile_y-1); c<=(tile_y+1); c++) {
            if (c < 0 || r >= level.width) { continue; }
            res.push([r,c]);
        }
    }
    return res;
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