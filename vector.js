class Vector {
    constructor(i=0, j=0, k=0) {
        this.i = i;
        this.j = j;
        this.k = k;
    }

    set_length(length) {
        if (this.magnitude === 0) { throw Error("Cannot set length of null vector!"); }
        let factor = length / this.magnitude;
        this.i *= factor;
        this.j *= factor;
        this.k *= factor;
    }

    normalise() {
        this.set_length(1);
    }

    get magnitude() {
        if (this.i === 0 && this.j === 0 && this.k === 0) {
            return 0;
        }
        return (this.i**2 + this.j**2 + this.k**2)**0.5;
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
    
    get z() { return this.k; }
    set z(v) { 
        if (typeof v !== "number") { throw Error("v must be integer or float"); }
        this.k = v;
    }
}

export { Vector }