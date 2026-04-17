import { Vector, RelativeVector, is_colliding } from "./mymath.js";

class UICanvas {
    constructor(name) {
        this.enabled = true;
        this.elements = {}
    }

    check_collisions(mouse) {
        if (!this.enabled) return;
        for (const element of this) {
            if (!element.clickable) continue;
            if (!is_colliding(mouse, element.generate_box())) { 
                if (element instanceof TextBox) {
                    element.editing = false;
                }
                continue; 
            }
            element.handle_click();
            return true;
        }
    }

    draw() {
        if (!this.enabled) return;
        for (const element of this) { 
            element.draw();
        }
    }

    set(name, element) { this.elements[name] = element; }
    get(name) { return this.elements[name]; }
    [Symbol.iterator]() { return Object.values(this.elements).values(); }
}

class Element {
    #padding
    #outer_bound
    constructor(context, pos, dimensions, colour) {
        this.context = context;
        this.clickable = false;
        this.enabled = true;

        this.pos = pos;
        this.dimensions = dimensions;
        this.#padding = new Vector();
        this.#outer_bound = new RelativeVector(this.#padding, this.dimensions);
        this.colour = colour;
    }

    set_outline(colour, thickness) {
        this.outline_colour = colour;
        this.thickness = (thickness === undefined) ? 1 : thickness;
    }

    draw() {
        if (!this.enabled) return;

        if (this.colour !== undefined) {
            this.context.fillStyle = this.colour;
            this.context.fillRect(...this.pos, ...this.dimensions);
        }

        if (this.outline_colour !== undefined) {
            this.context.strokeStyle = this.outline_colour;
            this.context.lineWidth = this.thickness;
            this.context.strokeRect(...this.pos, ...this.dimensions);
        }
    }

    generate_box() {
        return { 
            x: this.bounds[0].x, 
            y: this.bounds[0].y, 
            width: this.dimensions.x, 
            height: this.dimensions.y
        };
    }

    get bounds() {
        return [
            this.pos, 
            new RelativeVector(
                this.pos,
                this.#outer_bound
            )
        ];
    }
    
    get padding() { return this.#padding; }
    set padding(value) { this.#padding = value; }
}

class Text extends Element {
    #text
    #font
    #padding

    constructor(context, pos, text, font, text_colour, colour, padding, offset) {
        super(context, pos, new Vector(), colour);

        this.#text = text;
        this.#font = font;
        this.text_colour = text_colour;
        this.#padding = (padding === undefined) ? new Vector() : padding;
        this.offset = (offset === undefined) ? new Vector() : offset;
        
        this.text_alignment = "centre";
        this.text_dimensions = new Vector();
        this.text_measurings = this.remeasure(this.context);

        this.dimensions.x = this.text_dimensions.x + this.#padding.x;
        this.dimensions.y = this.text_dimensions.y + this.#padding.y;
    }

    draw() {
        if (!this.enabled) return;

        super.draw();
        this.context.font = this.#font;
        this.context.fillStyle = this.text_colour;
        let x = this.pos.x + this.offset.x;
        if (this.text_alignment === "centre") x += this.#padding.x/2;
        this.context.fillText(
            this.#text,
            x,
            this.pos.y + this.text_dimensions.y + this.#padding.y/2 + this.offset.y
        );
    }

    remeasure() {
        this.context.font = this.#font;
        this.text_measurings = this.context.measureText(this.#text);
        this.text_dimensions.x = this.text_measurings.width;
        this.text_dimensions.y = this.text_measurings.hangingBaseline;
        this.dimensions.x = this.text_dimensions.x + this.#padding.x;
        this.dimensions.y = this.text_dimensions.y + this.#padding.y;
        return this.text_measurings;
    }

    get text() { return this.#text; }
    set text(value) {
        this.#text = value;
        this.remeasure();
    }
    get padding() { return this.#padding; }
    set padding(value) {
        this.#padding = value;
        this.remeasure();
    }
    get font() { return this.#font; }
    set font(value) {
        this.#font = value;
        this.remeasure();
    }
}

class Button extends Text {
    constructor(context, pos, colour, text, font, text_colour, padding, offset) {
        super(context, pos, text, font, text_colour, colour, padding, offset);
        this.clickable = true;
    }

    on_click(handler) { this.on_click = handler; }
    handle_click() {
        if (!this.enabled) return;
        if (this.on_click === undefined) return;
        this.on_click(this);
    }
}

class TextBox extends Button {
    #cursor_element
    #cursor_accumulator
    #cursor_shown
    #editing
    constructor(context, pos, dimensions, font, text_colour, colour, offset, hint, hint_colour) {
        super(
            context, 
            pos,
            colour,
            (hint === undefined) ? "" : hint,
            font,
            (hint_colour === undefined) ? text_colour : hint_colour,
            new Vector(),
            offset
        );
        this.text_alignment = "left";
        this.dimensions = dimensions;

        this.padding = new RelativeVector(
            this.dimensions,
            this.text_dimensions
        );
        this.padding.invert = true;

        this.value = "";
        this.default_text_colour = text_colour;
        this.hint = hint;
        this.hint_colour = hint_colour;
        
        this.#cursor_accumulator = 0;
        this.#cursor_shown = true;
        this.#editing = false;
        
        //reduce font size by 2px
        let font_size;
        let cursor_font = [];
        for (let part of font.split(" ")) {
            if (part.includes("px")) {
                font_size = +part.slice(0, part.length-2);
                let size = font_size - 2;
                part = size.toString() + "px";
            }
            cursor_font.push(part);
        }
        cursor_font = cursor_font.join(" ");
        this.#cursor_element = new Text(
            this.context, 
            this.pos,
            "|", 
            cursor_font, 
            this.hint_colour, 
            undefined,
            undefined, 
            new RelativeVector(
                this.text_dimensions,
                new Vector(),
                new Vector(-5,5)
            )
        );

        this.on_click(self => self.editing = true);
    }

    draw() {
        if (!this.enabled) return;
        this.text = this.value;
        this.text_colour = this.default_text_colour;
        if (!this.editing && this.value === "") {
            if (this.hint === undefined) return;
            this.text = this.hint;
            this.text_colour = this.hint_colour;
        }
        super.draw();
        if (this.editing && this.#cursor_shown) {
            this.#cursor_element.draw();
        }
    }

    cursor_accumulator(value) {
        if (!this.editing) return;
        this.#cursor_accumulator += value;
        if (this.#cursor_accumulator >= 1000) {
            this.#cursor_accumulator = 0;
            this.#cursor_shown = !this.#cursor_shown;
        }
    }

    get editing() { return this.#editing; }
    set editing(value) {
        this.#editing = value;
        this.#cursor_accumulator = 0;
        this.#cursor_shown = true;
    }
}

export { UICanvas, Element, Text, Button, TextBox };