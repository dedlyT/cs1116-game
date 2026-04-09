const TILES = {
    empty: {name:"empty", colour:"white"},
    grass: {name:"grass", colour:"green"},
    wood: {name:"wood", colour:"brown", collidable:true, opaque:true}
};

function generate_array(length, element) {
  if (!(Number.isInteger(length))) { throw Error("width must be int") }
  let list = [];
  for (let i=0; i<length; i++) { list.push(element); }
  return list;
}

class Level {
    #tilesize;

    constructor(width=30, height=30) {
        this.matrix = [];
        let middle = generate_array(width, TILES.grass.name);
        middle[0] = TILES.wood.name;
        middle[29] = TILES.wood.name;
        this.matrix = generate_array(height, middle);
        let tops = generate_array(width, TILES.wood.name);
        this.matrix[0] = [...tops];
        this.matrix[29] = [...tops];

        this.#tilesize = 750 / Math.max(width, height);    
    }

    draw(context) {
        for (let [r, row] of this.matrix.entries()) {
            for (let [c, name] of row.entries()) {
                if (this.src === undefined) {
                    context.fillStyle = TILES[name].colour;
                    context.fillRect(c*this.#tilesize, r*this.#tilesize, this.#tilesize, this.#tilesize);   
                }
            }
        }
    }

    get width() { return this.matrix[0].length };
    get height() { return this.matrix.length };
    get vision_matrix() {
      let res = [];
      for (let row of this.matrix) {
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
        super(30, 30);

        let middle = generate_array(30, TILES.grass.name);
        middle[0] = TILES.wood.name;
        middle[29] = TILES.wood.name;
        
        let vert_block = [...middle];
        vert_block[5] = TILES.wood.name;
        this.matrix[4] = [...vert_block];
        this.matrix[5] = [...vert_block];
        this.matrix[6] = [...vert_block];

        let horiz_block = [...middle];
        horiz_block[4] = TILES.wood.name;
        horiz_block[5] = TILES.wood.name;
        horiz_block[6] = TILES.wood.name;
        this.matrix[20] = [...horiz_block];
    }
}

const LEVELS = {first: new First()};

export { LEVELS, TILES };