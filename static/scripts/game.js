import { Vector, Line, is_colliding, randint, RelativeVector } from "./mymath.js";
import { Entity } from "./player.js";
import { LEVELS, TILES, load_tiles } from "./levels.js";
import { UICanvas, Element, Text, Button } from "./ui.js";

let canvas;
let context;
let request;
let current_level;
let bounding_rect;
const HUD = new UICanvas();
const death_menu = new UICanvas();

const FPS = 60;
const INTERVAL = 1000 / FPS;
const TILESIZE = 25;
let last = Date.now();

const RESOLVE_X = (entity, old, x) => (old.x <= x) ? (x - entity.width - 0.01) : (x + TILESIZE + 0.01);
const RESOLVE_Y = (entity, old, y) => (old.y <= y) ? (y - entity.height - 0.01) : (y + TILESIZE + 0.01);
let move_camera_rect = new Vector(100, 100);
const plr = new Entity(undefined, new Vector(), new Vector(25, 25), 200);
let enemies = [];
let bullets = [];
const actions = {
    moving_up: false,
    moving_down: false,
    moving_left: false,
    moving_right: false,
    mouse: new Vector()
};
let start_run = Date.now();
let score = {"time":0, "levels":0};

document.addEventListener("DOMContentLoaded", init, false)
document.addEventListener("mousemove", mousemove, false);

function init() {
    canvas = document.querySelector("canvas");
    bounding_rect = canvas.getBoundingClientRect();
    context = canvas.getContext("2d");

    start_run = Date.now();
    const levels = Object.keys(LEVELS);
    load_new_level(LEVELS[levels[randint(0, levels.length-1)]]);

    create_hud();
    create_death_menu();

    window.addEventListener("keydown", press, false);
    window.addEventListener("keyup", unpress, false);
    window.addEventListener("click", event => {
        death_menu.check_collisions(actions.mouse);
    }, false);
    
    load_tiles(draw);
}

function load_new_level(level) {
    score["levels"]++;
    enemies.length = 0;
    bullets.length = 0;
    
    plr.context = context;
    plr.health = 100;
    plr.immunity_accumulator = 0;
    plr.immunity_timeout = 100;
    plr.immune = true;

    current_level = level;
    current_level.context = context;
    plr.coords.x = current_level.spawn.x;
    plr.coords.y = current_level.spawn.y;
    load_level(current_level);
}

function create_hud() {
    let element;
    const HP = new UICanvas();

    element = new Element(
        context,
        new Vector(),
        new Vector(),
        "lightgreen"
    );
    HP.set("background", element);

    element = new Element(
        context,
        new Vector(),
        new Vector(),
        "darkgrey"
    );
    HP.set("foreground", element);

    element = new Element(
        context,
        new Vector(10, 10),
        new Vector(400, 30)
    );
    element.set_outline("white", 2);
    HP.set("outline", element);

    HP.get("background").pos = new RelativeVector(
        HP.get("outline").bounds[0],
        new Vector()
    );
    HP.get("background").dimensions.y = HP.get("outline").dimensions.y;
    HP.get("foreground").pos = new RelativeVector(
        HP.get("background").bounds[1],
        HP.get("background").bounds[0],
        new Vector()
    );
    HP.get("foreground").dimensions.y = HP.get("outline").dimensions.y;

    HUD.set("hp", HP);
}

function create_death_menu() {
    death_menu.enabled = false;
    let element;

    element = new Element(
        context,
        new Vector(),
        new Vector(canvas.width, canvas.height),
        "rgb(0,0,0,0.5)"
    );
    death_menu.set("dimmer", element);

    element = new Element(
        context,
        new Vector(100, 100),
        new Vector(canvas.width-200, 200),
        "rebeccapurple"
    )
    element.set_outline("purple", 2);
    death_menu.set("background", element);

    element = new Text(
        context,
        new RelativeVector(
            death_menu.get("background").bounds[0],
            new Vector(20, 20)
        ),
        "You died!",
        "bold 40px Arial",
        "azure"
    );
    death_menu.set("title", element);

    element = new Text(
        context,
        new RelativeVector(
            death_menu.get("title").bounds[0],
            death_menu.get("title").bounds[1],
            new Vector(0, 30)
        ),
        "Time: ",
        "20px Arial",
        "azure"
    );
    death_menu.set("time_score", element);

    element = new Text(
        context,
        new RelativeVector(
            death_menu.get("time_score").bounds[0],
            death_menu.get("time_score").bounds[1],
            new Vector(0, 10)
        ),
        "Levels: ",
        "20px Arial",
        "azure"
    );
    death_menu.set("level_score", element);

    element = new Button(
        context,
        new RelativeVector(
            death_menu.get("level_score").bounds[0],
            death_menu.get("level_score").bounds[1],
            new Vector(0,20)
        ),
        "azure",
        "new run",
        "20px Arial",
        "purple",
        new Vector(20,20)
    );
    element.set_outline("purple", 4);
    element.on_click(self => {
        start_run = Date.now();
        const levels = Object.keys(LEVELS);
        load_new_level(LEVELS[levels[randint(0, levels.length-1)]]);
        death_menu.enabled = false;
    });
    death_menu.set("retry", element);

    element = new Button(
        context,
        new RelativeVector(
            death_menu.get("retry").bounds[1],
            death_menu.get("retry").bounds[0],
            new Vector(20)
        ),
        "azure",
        "my profile",
        "20px Arial",
        "purple",
        new Vector(20, 20)
    );
    element.set_outline("purple", 4);
    element.on_click(self => {
        let a = document.createElement("a");
        a.href = "/stats/";
        a.click();
    });
    death_menu.set("profile", element);
}

function draw() {
    request = window.requestAnimationFrame(draw);
    let current = Date.now();
    let elapsed = current - last;

    if (plr.immune) {
        plr.immunity_accumulator += elapsed;
        if (plr.immunity_accumulator >= plr.immunity_timeout) {
            plr.immunity_accumulator = 0;
            plr.immune = false;
        }
    }

    let dT = elapsed / 1000;
    if (elapsed <= INTERVAL) return;
    last = current - (elapsed % INTERVAL);

    if (!death_menu.enabled) {
        calculate_player(dT);
        calculate_bullets(dT);
        calculate_enemies(dT);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    current_level.draw_layer("background");

    current_level.draw_layer_attribute("middleground", "opaque");

    const enemies_clone = [...enemies];
    for (const enemy of enemies_clone) {
        enemy.draw();
        if (enemy.health !== 100) {
            const HP = enemy.hp_hud;
            const health_percentage = (enemy.health / 100);
            HP.get("background").dimensions.x = HP.get("outline").dimensions.x * health_percentage;
            HP.get("foreground").dimensions.x = HP.get("outline").dimensions.x * (1 - health_percentage);
            HP.draw();
        }
    }

    const bullets_clone = [...bullets];
    for (const bullet of bullets_clone) {
        bullet.draw();
    }

    draw_fov();
    current_level.draw_layer_attribute("middleground", "opaque");
    plr.draw();

    current_level.draw_layer("foreground");

    const HP = HUD.get("hp");
    const health_percentage = (plr.health / 100);
    HP.get("background").dimensions.x = HP.get("outline").dimensions.x * health_percentage;
    HP.get("foreground").dimensions.x = HP.get("outline").dimensions.x * (1 - health_percentage);

    HUD.draw();
    death_menu.draw();
}

function load_level(level) {
    for (const enemy_spawn of level.enemy_spawns) {
        const enemy = new Entity(context, new Vector(...enemy_spawn), new Vector(25,25), randint(100,150), "red");

        let element;
        enemy.hp_hud = new UICanvas();
        element = new Element(
            context,
            new Vector(),
            new Vector(),
            "lightgreen"
        );
        enemy.hp_hud.set("background", element);

        element = new Element(
            context,
            new Vector(),
            new Vector(),
            "darkgrey"
        );
        enemy.hp_hud.set("foreground", element);

        element = new Element(
            context,
            new RelativeVector(
                enemy.coords,
                new Vector(
                    -enemy.width,
                    -enemy.height
                )
            ),
            new Vector(75, 10)
        );
        element.set_outline("white", 2);
        enemy.hp_hud.set("outline", element);

        enemy.hp_hud.get("background").pos = new RelativeVector(
            enemy.hp_hud.get("outline").bounds[0],
            new Vector()
        );
        enemy.hp_hud.get("background").dimensions.y = enemy.hp_hud.get("outline").dimensions.y;
        enemy.hp_hud.get("foreground").pos = new RelativeVector(
            enemy.hp_hud.get("background").bounds[1],
            enemy.hp_hud.get("background").bounds[0],
            new Vector()
        );
        enemy.hp_hud.get("foreground").dimensions.y = enemy.hp_hud.get("outline").dimensions.y;

        enemies.push(enemy);
    }
}

function calculate_bullets(dT) {
    const bullets_clone = [...bullets];
    let dead_bullet_indexes = [];
    for (const [i, bullet] of bullets_clone.entries()) {
        const old = bullet.coords;
        const displacement = bullet.facing;
        displacement.set_length(bullet.speed);

        const KILL = (_, __, ___) => { 
            dead_bullet_indexes.push(i);
            return 0;
        };
        resolve_axis_collision(bullet, "x", displacement.x, dT, old, KILL);
        resolve_axis_collision(bullet, "y", displacement.y, dT, old, KILL);
    }
    bullets = bullets.filter((value, index) => {
        if (!dead_bullet_indexes.includes(index)) {
            return value;
        }
    });
}

function calculate_enemies(dT) {
    const enemies_clone = [...enemies];
    let dead_enemy_indexes = [];
    for (const [i, enemy] of enemies_clone.entries()) {
        const old = enemy.coords;
        enemy.face(plr.coords);
        const displacement = enemy.facing;
        displacement.set_length(enemy.speed);

        if (is_colliding(plr, enemy) && !plr.immune) {
            plr.health -= randint(4,8);
            plr.health = (plr.health < 0) ? 0 : plr.health;
            plr.immune = true;
            plr.immunity_accumulator = 0;
            if (plr.health <= 0) {
                score["time"] = Math.ceil((Date.now() - start_run) / 1000);
                death_menu.get("time_score").text = `Time: ${score["time"]} seconds`;
                death_menu.get("level_score").text = `Levels traversed: ${score["levels"]}`;
                death_menu.enabled = true;
            }
        }

        resolve_axis_collision(enemy, "x", displacement.x, dT, old, RESOLVE_X);
        resolve_axis_collision(enemy, "y", displacement.y, dT, old, RESOLVE_Y);

        let dead_bullet_indexes = [];
        const bullets_clone = [...bullets];
        for (const [ii, bullet] of bullets_clone.entries()) {
            if (is_colliding(enemy, bullet)) {
                dead_bullet_indexes.push(ii);
                enemy.health -= 20;
                if (enemy.health <= 0) {
                    dead_enemy_indexes.push(i);
                }
                continue;
            }
        }
        bullets = bullets.filter((value, index) => {
            if (!dead_bullet_indexes.includes(index)) {
                return value;
            }
        })
    }
    enemies = enemies.filter((value, index) => {
        if (!dead_enemy_indexes.includes(index)) {
            return value;
        }
    })
}

function die() {

}

function calculate_player(dT) {
    let old = plr.coords;
    let displacement = new Vector();
    if (actions.moving_up) displacement.y--;
    if (actions.moving_down) displacement.y++;
    if (actions.moving_left) displacement.x--;
    if (actions.moving_right) displacement.x++;

    if (displacement.magnitude !== 0) {
        displacement.set_length(plr.speed);
    }

    resolve_axis_collision(plr, "x", displacement.x, dT, old, RESOLVE_X);
    resolve_axis_collision(plr, "y", displacement.y, dT, old, RESOLVE_Y);

    plr.face(actions.mouse); 
}

function resolve_axis_collision(entity, axis, displacement_component, dT, old, resolution_lambda) {
    entity[axis] += displacement_component * dT;
    const adjf = get_adjacent_tiles(entity.coords, current_level.foreground);
    const adjm = get_adjacent_tiles(entity.coords, current_level.middleground);
    const adj_iter = [
        [adjf, current_level.foreground], 
        [adjm, current_level.middleground]
    ];

    for (let [adj, matrix] of adj_iter) {
        for (let [r,c] of adj) {
            const row = matrix[r];
            if (row === undefined) continue;
            const tilename = row[c];
            const tile_data = TILES[tilename];
            if (tile_data === undefined || tile_data.collidable === undefined) continue;
            
            const x = c*TILESIZE;
            const y = r*TILESIZE;
            if (is_colliding(entity, {x:x, y:y, width:TILESIZE, height:TILESIZE})) {
                entity[axis] = resolution_lambda(entity, old, axis === "x" ? x : y);
            }
        }
    }
}

function draw_fov() {
    let vision_mask = current_level.vision_mask;
    for (let [r, row] of vision_mask.entries()) {
        if (r === 0 || r === (vision_mask.length-1)) { continue; }
        for (let [c, item] of row.entries()) {
            if (c === 0 || c === (vision_mask[0].length-1)) { continue; }
            if (item === 0) { continue; }
            let tile = new Vector(c*TILESIZE, r*TILESIZE);
            let vertices = [
                new Vector(tile.x, tile.y), 
                new Vector(tile.x+TILESIZE, tile.y), 
                new Vector(tile.x, tile.y+TILESIZE), 
                new Vector(tile.x+TILESIZE, tile.y+TILESIZE)
            ];
            let distances = vertices.map(vertex => Vector.distance_between(plr.coords, vertex));
            let max_index = distances.reduce((max_i, dist, i, arr) => (dist > arr[max_i]) ? i : max_i, 0);
            let min_index = distances.reduce((min_i, dist, i, arr) => (dist < arr[min_i]) ? i : min_i, 0);
            vertices = vertices.filter( (_,i) => i !== max_index && i !== min_index );
            let points = [];
            for (let vertex of vertices) {
                let ray = Line.from_points(plr.center, vertex);
                let direction = Vector.directional_between(plr.center, vertex);
                
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
                let endpoint;
                if (updown !== null && leftright !== null) {
                    endpoint = (updown.distance_to(plr.center) > leftright.distance_to(plr.center)) ? updown : leftright;
                } else {
                    endpoint = (updown === null) ? leftright : updown;
                }
                points.push([vertex, endpoint])
            }

            context.fillStyle = "black";
            context.beginPath();
            context.moveTo(...points[0][0]);
            context.lineTo(...points[0][1]);
            context.lineTo(...points[1][1]);
            context.lineTo(...points[1][0]);
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

function press(event) {
    event.preventDefault();
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
        
        case " ":
            const bullet = new Entity(context, plr.center, new Vector(10,10), 500, "white");
            bullet.face(actions.mouse);
            bullets.push(bullet);
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
    actions.mouse.x = event.clientX - bounding_rect.left;
    actions.mouse.y = event.clientY - bounding_rect.top;
    if (!death_menu.enabled) {
        plr.face(actions.mouse);
    }
}