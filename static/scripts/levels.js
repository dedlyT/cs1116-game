import { Vector, randint } from "./mymath.js";

let xhttp;

const TILES = {
    empty: {name:"empty", should_ignore:true},
    grass1: {name:"grass1", src:"grass1.png"},
    grass2: {name:"grass2", src:"grass2.png"},
    grass3: {name:"grass3", src:"grass3.png"},
    flowers1: {name:"flowers1", src:"flowers1.png"},
    flowers2: {name:"flowers2", src:"flowers2.png"},
    flowers3: {name:"flowers3", src:"flowers3.png"},
    pebble1: {name:"pebble1", src:"pebble1.png"},
    pebble2: {name:"pebble2", src:"pebble2.png"},
    pebble3: {name:"pebble3", src:"pebble3.png"},
    pebble4: {name:"pebble4", src:"pebble4.png"},
    wall: {name:"wall", src:"wall.png", collidable:true, opaque:true},
    wall_vertical: {name:"wall_vertical", src:"wall_vertical.png", collidable:true, opaque:true},
    wall_horizontal: {name:"wall_horizontal", src:"wall_horizontal.png", collidable:true, opaque:true},
    wall_topleft: {name:"wall_topleft", src:"wall_topleft.png", collidable:true, opaque:true},
    wall_topright: {name:"wall_topright", src:"wall_topright.png", collidable:true, opaque:true},
    wall_bottomright: {name:"wall_bottomright", src:"wall_bottomright.png", collidable:true, opaque:true},
    wall_bottomleft: {name:"wall_bottomleft", src:"wall_bottomleft.png", collidable:true, opaque:true},
    wall_middletop: {name:"wall_middletop", src:"wall_middletop.png", collidable:true, opaque:true},
    wall_middleright: {name:"wall_middleright", src:"wall_middleright.png", collidable:true, opaque:true},
    wall_middlebottom: {name:"wall_middlebottom", src:"wall_middlebottom.png", collidable:true, opaque:true},
    wall_middleleft: {name:"wall_middleleft", src:"wall_middleleft.png", collidable:true, opaque:true},
    roof: {name:"roof", src:"roof.png"},
    roof_topleft: {name:"roof_topleft", src:"roof_topleft.png"},
    roof_top: {name:"roof_top", src:"roof_top.png"},
    roof_topright: {name:"roof_topright", src:"roof_topright.png"},
    roof_right: {name:"roof_right", src:"roof_right.png"},
    roof_bottomright: {name:"roof_bottomright", src:"roof_bottomright.png"},
    roof_bottom: {name:"roof_bottom", src:"roof_bottom.png"},
    roof_bottomleft: {name:"roof_bottomleft", src:"roof_bottomleft.png"},
    roof_left: {name:"roof_left", src:"roof_left.png"}
};

const LOADABLE_TILES = Object.keys(TILES).filter((value) => {
    if (TILES[value].src !== undefined) return value;
})

function load_tiles(callback) {
    let num_assets = LOADABLE_TILES.length;
    for (const tile of LOADABLE_TILES) {
        const loaded = () => {
            console.log("LOADED!");
            num_assets--;
            if (num_assets === 0) callback();
        };
        TILES[tile].sprite = new Image();
        TILES[tile].sprite.addEventListener("load", loaded, false);
        TILES[tile].sprite.src = `/static/sprites/${TILES[tile].src}`;
    }
}

function generate_array(length, element) {
    if (!(Number.isInteger(length))) { throw Error("width must be int") }
    let list = [];
    for (let i=0; i<length; i++) {
        let temp = element; 
        if (element instanceof Array) {
            temp = [...element];
        }
        list.push(temp); 
    }
    return list;
}

function generate_matrix(width, height, element) {
    return generate_array(height, generate_array(width, element));
}

class Level {
    constructor(context, name, width=30, height=30) {
        this.context = context;
        this.name = name;

        this.background = generate_matrix(width, height, TILES.grass1.name);

        this.middleground = generate_matrix(width, height, TILES.empty.name);

        this.foreground = generate_matrix(width, height, TILES.empty.name);

        this.tilesize = 750 / Math.max(width, height);
        
        this.spawn = new Vector(5*this.tilesize, 5*this.tilesize);
        this.enemy_spawns = [];
    }

    draw_layer(layer) {
        let matrix = this[layer];
        if (matrix === undefined) throw Error("layer is invalid!");
        
        for (let [r, row] of matrix.entries()) {
            for (let [c, name] of row.entries()) {
                this.draw_tile(name, c*this.tilesize, r*this.tilesize, this.tilesize)
            }
        }
    }

    draw_layer_attribute(layer, attribute, should_have=true) {
        let matrix = this[layer];
        if (matrix === undefined) throw Error("layer is invalid!");

        for (let [r, row] of matrix.entries()) {
            for (let [c, name] of row.entries()) {
                let tile_attr = TILES[name][attribute];
                if (should_have && tile_attr === undefined) { continue; }
                if (!should_have && tile_attr !== undefined) { continue; }
                this.draw_tile(name, c*this.tilesize, r*this.tilesize, this.tilesize);
            }
        }
    }

    draw_tile(tile_name, x, y, tilesize) {
        let tile_data = TILES[tile_name]
        if (tile_data.should_ignore === true) return;
        
        if (tile_data.src === undefined) {
            if (tile_data.alpha !== undefined) {
                this.context.globalAlpha = tile_data.alpha;
            }
            this.context.fillStyle = tile_data.colour;
            this.context.globalAlpha = 1.0;
            this.context.fillRect(x, y, tilesize, tilesize);   
        } else {
            this.context.drawImage(
                tile_data.sprite,
                x, y,
                this.tilesize, this.tilesize
            );
        }
    }

    get width() { return this.matrix[0].length };
    get height() { return this.matrix.length };
    get vision_mask() {
        let res = [];
        for (let row of this.middleground) {
            let line = [];
            for (let item of row) {
                line.push(Number(TILES[item].opaque === true));
            }
            res.push(line);
        }
        return res;
    }

    static export(level) {
        let enemy_spawns_out = [];
        for (const enemy_spawn of level.enemy_spawns) {
            enemy_spawns_out.push([...enemy_spawn]);
        }
        let json_out = {
            "background": level.background,
            "middleground": level.middleground,
            "foreground": level.foreground,
            "spawn": [...level.spawn],
            "enemy_spawns": enemy_spawns_out
        };
        let a = document.createElement("a");
        let file = new Blob([JSON.stringify(json_out)], {type: "application/json"})
        a.href = URL.createObjectURL(file);
        a.download = level.name;
        a.click();
    }

    static import_filename(level_name) {
        const level_filename = level_name.replace(".json", "");

        let level;
        let data = new FormData();
        data.append("filename", `${level_filename}.json`)
        xhttp = new XMLHttpRequest();
        xhttp.addEventListener("readystatechange", () => {
            if (xhttp.readyState !== 4 || xhttp.status !== 200) return;
            level = Level.import(level_filename, JSON.parse(xhttp.responseText));
        }, false);
        xhttp.open("POST", "/level", false);
        xhttp.send(data);

        return level;
    }

    static import(name, data) {
        let level = new Level(undefined, name);
        level.background = data.background;
        level.middleground = data.middleground;
        level.foreground = data.foreground;
        level.spawn = new Vector(...data.spawn);
        let enemy_spawns_in = [];
        for (const enemy_spawn of data.enemy_spawns) {
            enemy_spawns_in.push(new Vector(...enemy_spawn));
        }
        level.enemy_spawns = enemy_spawns_in;
        return level;
    }
}

let LEVELS = {};
let levels_request = new XMLHttpRequest();
levels_request.addEventListener("readystatechange", () => {
    if (levels_request.readyState !== 4 || levels_request.status !== 200) return;
    const data = JSON.parse(levels_request.responseText);
    for (let filename of data) {
        LEVELS[filename.replace(".json", "")] = Level.import_filename(filename);
    }
}, false);
levels_request.open("GET", "/level/", false);
levels_request.send();

export { Level, LEVELS, TILES, load_tiles };