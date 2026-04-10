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
    constructor(width=30, height=30) {
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
    }

    draw_layer(context, layer) {
        let matrix = this[layer];
        if (matrix === undefined) throw Error("layer is invalid!");
        
        for (let [r, row] of matrix.entries()) {
            for (let [c, name] of row.entries()) {
                this.draw_tile(context, name, c*this.tilesize, r*this.tilesize, this.tilesize)
            }
        }
    }

    draw_layer_attribute(context, layer, attribute, should_have=true) {
        let matrix = this[layer];
        if (matrix === undefined) throw Error("layer is invalid!");

        for (let [r, row] of matrix.entries()) {
            for (let [c, name] of row.entries()) {
                let tile_attr = TILES[name][attribute];
                if (should_have && tile_attr === undefined) { continue; }
                if (!should_have && tile_attr !== undefined) { continue; }
                this.draw_tile(context, name, c*this.tilesize, r*this.tilesize, this.tilesize);
            }
        }
    }

    draw_tile(context, tile_name, x, y, tilesize) {
        let tile_data = TILES[tile_name]
        if (tile_data.should_ignore === true) return;
        
        if (tile_data.src === undefined) {
            if (tile_data.alpha !== undefined) {
                context.globalAlpha = tile_data.alpha;
            }
            context.fillStyle = tile_data.colour;
            context.globalAlpha = 1.0;
            context.fillRect(x, y, tilesize, tilesize);   
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
}

class First extends Level {
    constructor() {
        super();

        let grass_row = generate_array(30, TILES.grass.name);
        let ranges = [[0,2],[2,4],[4,5],[4,5],[3,4],[0,3]];
        for (let [i, range] of ranges.entries()) {
            let row = [...grass_row];
            let size = randint(...range);
            for (let n=0; n<size; n++) { row[7+n] = TILES.discoloured_grass.name; }
            this.background[3+i] = row;
        }

        let middle = generate_array(30, TILES.empty.name);
        middle[0] = TILES.woodwall.name;
        middle[29] = TILES.woodwall.name;

        let vert_block = [...middle];
        vert_block[5] = TILES.woodwall.name;
        this.middleground[4] = [...vert_block];
        this.middleground[7] = [...vert_block];
        this.middleground[8] = [...vert_block];

        let horiz_block = [...middle];
        horiz_block[4] = TILES.woodwall.name;
        horiz_block[7] = TILES.woodwall.name;
        horiz_block[8] = TILES.woodwall.name;
        horiz_block[9] = TILES.woodwall.name;
        this.middleground[20] = horiz_block;

        let roof_block = generate_array(30, TILES.empty.name);
        roof_block[5] = TILES.woodroof.name;
        roof_block[6] = TILES.woodroof.name;
        this.foreground[20] = roof_block;
    }
}

class Second extends Level {
    constructor() {
        super();

        const _=0;

        this.background = generate_matrix(30, 30, TILES.empty.name);
        console.log(this.background);
        let background_matrix = [
        //   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
   /*0*/    [_, _, _, _, _, _, _, _, _, _, _, _, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*1*/    [_, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*2*/    [_, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _],
   /*3*/    [_, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _],
   /*4*/    [_, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _],
   /*5*/    [_, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _],
   /*6*/    [_, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, _, _, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _],
   /*7*/    [_, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _],
   /*8*/    [_, _, _, 1, 1, 1, 1, _, _, _, _, _, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _],
   /*9*/    [_, _, _, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, _, _, _, _, _],
   /*10*/   [_, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _],
   /*11*/   [_, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _],
   /*12*/   [_, _, _, _, _, _, _, _, _, 1, 1, 1, 1, _, 1, 1, _, 1, 1, 1, 1, _, 1, 1, 1, 1, 1, 1, 1, 1],
   /*13*/   [_, _, _, _, _, _, _, _, _, _, 1, 1, 1, _, 1, 1, _, 1, 1, 1, 1, _, _, 1, 1, 1, 1, 1, 1, 1],
   /*14*/   [_, _, _, _, _, _, _, _, _, _, _, 1, 1, _, _, _, _, _, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1],
   /*15*/   [_, _, _, _, _, _, _, _, _, _, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*16*/   [_, _, _, _, _, _, _, _, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*17*/   [_, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*18*/   [_, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*19*/   [_, _, 1, 1, 1, _, 1, 1, _, _, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*20*/   [_, _, 1, 1, _, _, 1, 1, _, _, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*21*/   [_, _, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*22*/   [_, _, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*23*/   [_, _, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*24*/   [_, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*25*/   [_, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*26*/   [_, _, _, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*27*/   [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*28*/   [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
   /*29*/   [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]
        ]
        console.log(background_matrix);
        for (let [r, row] of background_matrix.entries()) {
            for (let [c, item] of row.entries()) {
                this.background[r][c] = (item === 1) ? TILES.grass.name : TILES.empty.name;
            }
        }

        this.middleground = generate_matrix(30, 30, TILES.empty.name);
        this.foreground = generate_matrix(30, 30, TILES.empty.name);

        this.spawn = new Vector(7*this.tilesize, 25*this.tilesize);
    }
}

const LEVELS = {first: new Second()};

export { LEVELS, TILES };