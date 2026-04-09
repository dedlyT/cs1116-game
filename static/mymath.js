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

export { Vector, Line }