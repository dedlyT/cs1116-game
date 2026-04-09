import { Vector } from "./mymath.js";

class Player {
    constructor(x, y, width, height, default_speed) {
        this.coords = new Vector(x,y);
        this.angle = 0;
        this.width = width;
        this.height = height;
        this.default_speed = default_speed;
        this.speed = default_speed;
    }

    draw(context) {
        context.save();
        context.translate(this.center.x, this.center.y);
        context.rotate(this.angle);
        context.fillStyle = "red";
        context.fillRect(-(this.width/2), -(this.height/2), this.width, this.height);
        context.restore();
    }

    set_facing(vector) {
        this.angle = Math.PI + Vector.angle_between(this.center, vector);
    }

    get x() { return this.coords.x; }
    set x(v) { this.coords.x = v; }
    get y() { return this.coords.y; }
    set y(v) { this.coords.y = v; }
    get center() {
        return new Vector(this.x + (this.width/2), this.y + (this.height/2));
    }
}

export { Player }