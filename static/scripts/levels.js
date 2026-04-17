import { Vector, randint } from "./mymath.js";

const TILES = {
    empty: {name:"empty", should_ignore:true},
    grass: {name:"grass", colour:"green"},
    discoloured_grass: {name:"discoloured_grass", colour:"darkgreen"},
    woodwall: {name:"woodwall", colour:"wheat", collidable:true, opaque:true, persistent:true},
    woodroof: {name:"woodroof", colour:"tan"},
};

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

        this.background = generate_matrix(width, height, TILES.grass.name);

        this.middleground = [];
        let middle = generate_array(width, TILES.empty.name);
        middle[0] = TILES.woodwall.name;
        middle[29] = TILES.woodwall.name;
        this.middleground = generate_array(height, middle);
        let tops = generate_array(width, TILES.woodwall.name);
        this.middleground[0] = [...tops];
        this.middleground[29] = [...tops];

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
        const level_filename = level_name.split(".json")[0];
        const level_url = `${SCRIPT_ROOT}/level/${level_filename}.json`;
        fetch(level_url)
            .then(res => res.json())
            .then(data => Level.import(level_filename, data) );
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
fetch(`${SCRIPT_ROOT}/level/`)
    .then(res => res.json())
    .then(data => {
        for (let filename of data) {
            LEVELS[filename.replace(".json", "")] = Level.import_filename(filename);
        }
    });

export { Level, LEVELS, TILES };