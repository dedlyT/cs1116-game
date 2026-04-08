class Vector {
    constructor(i=0, j=0) {
        this.i = i;
        this.j = j;
    }

    set_length(length) {
        if (this.magnitude === 0) { throw Error("Cannot set length of null vector!"); }
        let factor = length / this.magnitude;
        this.i *= factor;
        this.j *= factor;
    }

    normalise() {
        this.set_length(1);
    }

    distance_to(vector) {
        return Vector.distance_between(this, vector);
    }

    angle_between(vector) {
        return Vector.directional_between(this, vector).angle;
    }

    get magnitude() {
        if (this.i === 0 && this.j === 0) {
            return 0;
        }
        return (this.i**2 + this.j**2)**0.5;
    }

    get angle() {
        if (this.i === 0 && this.j === 0) {
            return 0;
        }
        return Vector.angle_between(this, new Vector(0,-1));
    }
    set angle(v) {
        if (typeof v !== "number") { throw Error("v must be integer or float"); }
        if (v > (2 * Math.PI) || v < 0) { throw Error("v must be an radian angle between 0 and 2*pi!")}
        let magnitude = this.magnitude;
        this.i = magnitude * Math.sin(v);
        this.j = magnitude * Math.cos(v);
    }

    get x() { return this.i; }
    set x(v) { 
        if (typeof v !== "number") { throw Error("v must be integer or float"); }
        this.i = v; 
    }

    get y() { return this.j; }
    set y(v) { 
        if (typeof v !== "number") { throw Error("v must be integer or float"); }
        this.j = v; 
    }

    static differential_between(v, u) {
        return new Vector(v.x - u.x, 
                          v.y - u.y);
    }

    static directional_between(v, u) {
        return Vector.differential_between(v,u).normalise();
    }

    static distance_between(v, u) {
        return Vector.differential_between(v, u).magnitude;
    }

    static angle_between(v, u) {
        return Math.atan2(u.y-v.y, u.x-v.x);
    }

    static dot_product(v, u) {
        return (v.x*u.x) + (v.y*u.y);
    }
}

export { Vector }