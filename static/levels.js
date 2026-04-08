const TILES = {
    empty: {name:"empty", colour:"white"},
    grass: {name:"grass", colour:"green"},
    wood: {name:"wood", colour:"brown", collidable:true}
};

function generate_array(length, element) {
  if (!(Number.isInteger(length))) { throw Error("width must be int") }
  let list = [];
  for (let i=0; i<length; i++) { list.push(element); }
  return list;
}

class Level {
    constructor() {
        this.matrix = [];
        let middle = generate_array(30, TILES.grass.name);
        middle[0] = TILES.wood.name;
        middle[29] = TILES.wood.name;
        this.matrix = generate_array(30, middle);
        let tops = generate_array(30, TILES.wood.name);
        this.matrix[0] = [...tops];
        this.matrix[29] = [...tops];
    }

    draw(context) {
        for (let [r, row] of this.matrix.entries()) {
            for (let [c, name] of row.entries()) {
                if (this.src === undefined) {
                    context.fillStyle = TILES[name].colour;
                    context.fillRect(r*25, c*25, 25, 25);   
                }
            }
        }
    }

    get width() { return this.matrix[0].length };
    get height() { return this.matrix.length };
}

const LEVELS = {first: new Level()};

export { LEVELS, TILES };