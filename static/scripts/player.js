import { Vector } from "./mymath.js";

class Player {
    constructor(context, pos, dimensions, default_speed) {
        this.context = context;
        this.coords = new Vector(...pos);
        this.dimensions = new Vector(...dimensions);
        this.angle = 0;
        this.default_speed = default_speed;
        this.speed = default_speed;
    }

    draw() {
        this.context.save();
        this.context.translate(this.center.x, this.center.y);
        this.context.rotate(this.angle);
        this.context.fillStyle = "red";
        this.context.fillRect(-(this.width/2), -(this.height/2), this.width, this.height);
        this.context.restore();
    }

    set_facing(vector) {
        this.angle = Math.PI + Vector.angle_between(this.center, vector);
    }

    get x() { return this.coords.x; }
    set x(v) { this.coords.x = v; }
    get y() { return this.coords.y; }
    set y(v) { this.coords.y = v; }
    get width() { return this.dimensions.x; }
    get height() { return this.dimensions.y; }
    get center() {
        return new Vector(this.x + (this.width/2), this.y + (this.height/2));
    }
}

export { Player }