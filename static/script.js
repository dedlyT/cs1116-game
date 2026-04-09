import { Vector, Line } from "./mymath.js";
import { Player } from "./player.js";
import { LEVELS, TILES } from "./levels.js";

let canvas;
let context;
let request;

const FPS = 30;
const INTERVAL = 1000 / FPS;
const TILESIZE = 25;
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
    if (elapsed <= INTERVAL) return;
    last = current - (elapsed % INTERVAL);

    calculate_movement(elapsed);

    context.clearRect(0, 0, canvas.width, canvas.height);
    LEVELS.first.draw_layer(context, "background");
    LEVELS.first.draw_layer_attribute(context, "middleground", "persistent", false);
    draw_fov(context);
    LEVELS.first.draw_layer_attribute(context, "middleground", "persistent");
    plr.draw(context);
    LEVELS.first.draw_layer(context, "foreground");
}

function calculate_movement(dT) {
    let old = plr.coords;
    let displacement = new Vector();
    if (actions.moving_up) displacement.y--;
    if (actions.moving_down) displacement.y++;
    if (actions.moving_left) displacement.x--;
    if (actions.moving_right) displacement.x++;

    if (displacement.magnitude !== 0) {
        displacement.set_length(plr.speed);
    }

    resolve_axis_collision("x", displacement.x, dT, (x) => (old.x <= x) ? (x - plr.width - 0.01) : (x + TILESIZE + 0.01));
    resolve_axis_collision("y", displacement.y, dT, (y) => (old.y <= y) ? (y - plr.height - 0.01) : (y + TILESIZE + 0.01));

    plr.set_facing(actions.mouse);
}

function resolve_axis_collision(axis, displacement_component, dT, resolution_lambda) {
    plr[axis] += displacement_component * dT;
    let adjf = get_adjacent_tiles(plr.coords, LEVELS.first.foreground);
    let adjm = get_adjacent_tiles(plr.coords, LEVELS.first.middleground);
    let adj_iter = [
        [adjf, LEVELS.first.foreground], 
        [adjm, LEVELS.first.middleground]
    ];

    for (let [adj, matrix] of adj_iter) {
        for (let [r,c] of adj) {
            if (TILES[matrix[r][c]].collidable === undefined) continue;
            
            let x = c*TILESIZE;
            let y = r*TILESIZE;
            if (is_colliding(plr, {x:x, y:y, width:TILESIZE, height:TILESIZE})) {
                plr[axis] = resolution_lambda(axis === "x" ? x : y);
            }
        }
    }
}

function draw_fov(context) {
    let vision_mask = LEVELS.first.vision_mask;
    for (let [r, row] of vision_mask.entries()) {
        if (r === 0 || r === (vision_mask.length-1)) { continue; }
        for (let [c, item] of row.entries()) {
            if (c === 0 || c === (vision_mask[0].length-1)) { continue; }
            if (item === 0) { continue; }
            let tile = new Vector(c*TILESIZE, r*TILESIZE);
            let vertices = [new Vector(tile.x, tile.y), new Vector(tile.x+TILESIZE, tile.y), new 
                Vector(tile.x, tile.y+TILESIZE), new Vector(tile.x+TILESIZE, tile.y+TILESIZE)];
            let distances = vertices.map(vertex => Vector.distance_between(plr.coords, vertex));
            let max_index = distances.reduce((max_i, dist, i, arr) => (dist > arr[max_i]) ? i : max_i, 0);
            let min_index = distances.reduce((min_i, dist, i, arr) => (dist < arr[min_i]) ? i : min_i, 0);
            vertices = vertices.filter( (_,i) => i !== max_index && i !== min_index );
            let points = [];
            for (let vertex of vertices) {
                let ray = Line.from_points(plr.coords, vertex);
                let direction = Vector.directional_between(plr.coords, vertex);
                
                let border_lines = [];
                if (direction.i < 0) {
                    border_lines.push( Line.from_points(new Vector(canvas.width), new Vector(canvas.width, 1)) );
                } else {
                    border_lines.push( Line.from_points(new Vector(), new Vector(0,1)) );
                }
                if (direction.j > 0) {
                    border_lines.push(new Line(0, 0));
                } else {
                    border_lines.push(new Line(0, canvas.height));
                }
                
                let updown = Line.get_intercept(ray, border_lines[0]);
                let leftright = Line.get_intercept(ray, border_lines[1]);
                console.log(direction);
                console.log(border_lines);
                console.log(updown, leftright);
                let endpoint;
                if (updown !== null && leftright !== null) {
                    
                    endpoint = (updown.distance_to(plr.coords) > leftright.distance_to(plr.coords)) ? updown : leftright;
                } else {
                    endpoint = (updown === null) ? leftright : updown;
                }
                points.push([vertex, endpoint])
            }

            context.fillStyle = "black";
            context.beginPath();
            context.moveTo(points[0][0].x, points[0][0].y);
            context.lineTo(points[0][1].x, points[0][1].y);
            context.lineTo(points[1][1].x, points[1][1].y);
            context.lineTo(points[1][0].x, points[1][0].y);
            context.closePath();
            context.fill();
        }
    }
}

/*EXAMPLE:
- - - - -
A B C - -
D O E - -
F G H - -
pos is at O
returns: [[Ar,Ac], [Br,Bc], [Cr, Cc], [Dr, Dc], [Or, Oc], ... ], 
        where LEVELS[Ar][Ac] == A, LEVELS[Br][Bc] == B, etc. etc.
NOTE: if the coords of a nearby tile go outside the range of the level matrix, they are discluded from the result.
*/
function get_adjacent_tiles(pos, level) {
    let tile_x = Math.floor(pos.x / TILESIZE);
    let tile_y = Math.floor(pos.y / TILESIZE);
    let res = [];
    for (let r=(tile_y-1); r<=(tile_y+1); r++) {
        if (r < 0 || r >= level.height) { continue; }
        for(let c=(tile_x-1); c<=(tile_x+1); c++) {
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