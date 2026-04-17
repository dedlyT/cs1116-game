import { Vector } from "./mymath.js";

class Entity {
    #facing
    constructor(context, coords, dimensions, default_speed, colour) {
        this.context = context;
        this.coords = coords;
        this.dimensions = dimensions;
        this.default_speed = default_speed;
        this.speed = default_speed;
        this.colour = (colour === undefined) ? "yellow" : colour;
        this.#facing = new Vector();
        this.health = 100;
    }

    draw() {
        this.context.save();
        this.context.translate(this.x + this.width/2, this.y + this.height/2);
        this.context.rotate(Math.PI + this.angle);
        this.context.fillStyle = this.colour;
        this.context.fillRect(-(this.width/2), -(this.height/2), this.width, this.height);
        this.context.restore();
    }

    face(vector) {
        this.#facing = Vector.directional_between(vector, this.center);
    }

    get x() { return this.coords.x; }
    set x(v) { this.coords.x = v; }
    get y() { return this.coords.y; }
    set y(v) { this.coords.y = v; }
    get width() { return this.dimensions.x; }
    get height() { return this.dimensions.y; }
    get center() { return new Vector(this.x + (this.width/2), this.y + (this.height/2)); }
    get angle() { return this.facing.angle }
    get facing() { return new Vector(...this.#facing); }
}

export { Entity }