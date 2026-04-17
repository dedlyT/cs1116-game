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
        return Vector.angle_between(this, new Vector());
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

    //...Vector returns [i, j]
    *[Symbol.iterator]() {
        yield this.i;
        yield this.j;
    }

    static differential_between(v, u) {
        return new Vector(v.x - u.x, 
                          v.y - u.y);
    }

    static directional_between(v, u) {
        let vector = Vector.differential_between(v,u);
        vector.normalise();
        return vector;
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

class RelativeVector extends Vector {
    #inversion_multiplier
    constructor() {
        let bound_j;
        let relative_i;
        let relative_j
        switch (arguments.length) {
            case 4:
                bound_j = arguments[1];
                relative_i = arguments[2];
                relative_j = arguments[3];
                break;
            case 3:
                bound_j = arguments[1];
                relative_i = arguments[2];
                relative_j = arguments[2];
                break;
            case 2:
                bound_j = arguments[0];
                relative_i = arguments[1];
                relative_j = arguments[1];
                break;
        }

        super();
        this.bound_vector_i = arguments[0];
        this.bound_vector_j = bound_j;
        this.relative_vector_i = relative_i;
        this.relative_vector_j = relative_j;
        this.#inversion_multiplier = new Vector(1,1);
    }

    get i() { return this.bound_vector_i.i + (this.#inversion_multiplier.i * this.relative_vector_i.i); }
    set i(_) { return; }
    
    get j() { return this.bound_vector_j.j + (this.#inversion_multiplier.j * this.relative_vector_j.j); }
    set j(_) { return; }

    get bound_i() { return this.bound_vector_i.i; }
    get bound_j() { return this.bound_vector_j.j; }

    get relative_i() { return this.relative_vector_i.i; }
    get relative_j() { return this.relative_vector_j.j; }

    set invert(value) { this.#inversion_multiplier = (value) ? new Vector(-1, -1) : new Vector(1, 1); }
    set invert_i(value) { this.#inversion_multiplier.i = (value) ? -1 : 1; }
    set invert_j(value) { this.#inversion_multiplier.j = (value) ? -1 : 1; }
}

class Line {
    constructor(slope, yintercept, is_vertical=false, x=undefined) {
        if (!is_vertical) {
            if (slope === Infinity) { throw Error("slope cannot be Infinity! please use Line.create_vertical") }
            if (yintercept === null) { throw Error("slope must intercept y axis! please use Line.create_vertical")}
            this.m = slope;
            this.c = yintercept;
        } else {
            this.m = Infinity;
            this.c = null;
            if (x === undefined) { throw Error("vertical line must be given an x value!") }
            this.x = x;
        }
    }

    get slope() { return this.m; }
    get yintercept() { return this.c; }

    static from_points(point1, point2) {
        if (!(point1 instanceof Vector) || !(point2 instanceof Vector)) { throw Error("point1 and point2 must be Vector!"); }
        let slope = (point2.y - point1.y) / (point2.x - point1.x);
        if (slope === Infinity) {
            return Line.create_vertical(point1.x)
        }
        let yintercept = point1.y - (slope * point1.x);
        return new Line(slope, yintercept);
    }

    static get_intercept(line1, line2) {
        if (!(line1 instanceof Line) || !(line2 instanceof Line)) { throw Error("line1 and line2 must be Line!"); }

        // catch identical lines
        if (line1.m === line2.m && line1.c === line2.c) {
            if (line1.m === Infinity && line2.m === Infinity) {
                if (line1.x === line2.x) {
                    return Infinity;
                }
            } else { 
                return Infinity;
            } 
        }

        // catch parallel lines
        if (line1.m === line2.m) {
            return null;
        }
        
        let x;
        if (line1.m === Infinity || line2.m === Infinity) {
            x = (line1.m === Infinity) ? line1.x : line2.x;

            // x = the x of the vertical line
        } else {
            x = (line2.c - line1.c) / (line1.m - line2.m);
            // rearranged y = mx+c to form x = (c2 - c1)/(m1 - m2)
        }
        let y = line1.m * x + line1.c;

        return new Vector(x,y);
    }

    static create_vertical(x) {
        return new Line(Infinity, null, true, x);
    }
}

function randint(a, b=null) {
    if (b === null) { b=a; a=0; }
    if (!Number.isInteger(a) || !Number.isInteger(b)) { throw Error("a and b must be integers!"); }
    let min = Math.min(a, b);
    let max = Math.max(a, b);
    return Math.floor(min + (max - min + 1) * Math.random());
}

function is_colliding(victim, perp) {
    let victim_dimensions = [
        ("width" in victim) ? victim.width : 0,
        ("height" in victim) ? victim.height : 0
    ]
    let perp_dimensions = [
        ("width" in perp) ? perp.width : 0,
        ("height" in perp) ? perp.height : 0
    ]

    return (victim.x + victim_dimensions[0]) > perp.x &&
           victim.x < (perp.x + perp_dimensions[0]) &&
           (victim.y + victim_dimensions[1]) > perp.y &&
           victim.y < (perp.y + perp_dimensions[1]);
}

export { Vector, RelativeVector, Line, randint, is_colliding }