import { Vector, RelativeVector, is_colliding, randint } from "./mymath.js";
import { Level, TILES } from "./levels.js";
import { UICanvas, Element, Text, Button, TextBox } from "./ui.js";

let canvas;
let context;
let request;
let level_uploader;

const FPS = 30;
const INTERVAL = 1000 / FPS;
let last = Date.now();

let current_level;
const LAYERS = ["background", "middleground", "foreground"];
const NAME_LEGAL_CHARS = "abcdefghijklmnopqrstuvwxyz123456789_";
const NAME_MAX_CHARS = 20;
let current_layer = "background";
let current_tile = TILES.woodwall.name;
let show_all_layers = true;
let relative_tilesize = 25;
let relative_offset = new Vector();

let main_menu;
let dropdown_menu;
let edit_menu;

const mouse = {lclick: false, rclick: false, pos: null};

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    level_uploader = document.querySelector("#level_uploader");
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    current_level = new Level(context);
    create_dropdown_menu();
    create_edit_menu();
    create_main_menu();

    level_uploader.addEventListener("change", event => {
        const file = event.target.files[0];
        const name = file.name.split(".json")[0];

        const reader = new FileReader();
        reader.onload = event => {
            current_level = Level.import(name, JSON.parse(event.target.result));
            current_level.context = context;
            edit_menu.get("level_name").value = name;
            edit_menu.get("level_name_length").text = `${name.length}/${NAME_MAX_CHARS}`;
            edit_menu.enabled = false;
            level_uploader.value = null;
        };
        reader.readAsText(file);
    });

    window.addEventListener("mousemove", mousemove, false);
    window.addEventListener("mousedown", click, false);
    window.addEventListener("mouseup", unclick, false);
    window.addEventListener("keydown", press, false);
    window.addEventListener("keyup", unpress, false);
    draw();
}

function create_dropdown_menu() {
    dropdown_menu = new UICanvas();
    dropdown_menu.set("page", new UICanvas());
    dropdown_menu.enabled = false;
}
    
//future functionality for more than 20 tiles! (20 tiles/page)
function generate_dropdown_page(page) {
    let element;
    const page_canvas = dropdown_menu.get("page");
    const MAX_PER_PAGE = 20;
    let last_tile;
    let i=-1;

    let tiles = Object.keys(TILES);
    if (page === 0) { tiles = ["spawn", "+ enemy", "- enemy", ...tiles]; }

    for (let tile of tiles) {
        i++;
        if (i < MAX_PER_PAGE * page) continue;
        if (i > MAX_PER_PAGE + MAX_PER_PAGE * page) break;

        let vectors;
        if (last_tile === undefined) {
            vectors = [
                main_menu.get("layer_select").bounds[0], 
                main_menu.get("tile_dropdown").bounds[1]
            ];
        } else {
            vectors = page_canvas.get(last_tile).bounds;
        }

        element = new Button(
            context,
            new RelativeVector(vectors[0], vectors[1], new Vector(0,5)),
            (page === 0 && i < 3) ? "hotpink" : "darkslateblue",
            tile,
            "15px Arial",
            "azure",
            new Vector(10,10)          
        );
        element.on_click(self => {
            const last_tile = dropdown_menu.get("page").get(current_tile);
            last_tile.text_colour = "azure";
            last_tile.set_outline("rgb(0,0,0,0)");
            current_tile = self.text;
            self.text_colour = "plum";
            self.set_outline("plum", 2);
        });
        if (tile === current_tile) {
            element.text_colour = "plum";
            element.set_outline("plum", 2);
        }
        page_canvas.set(tile, element);
        last_tile = tile;
    }
    return page_canvas;
}

function create_edit_menu() {
    let element;
    edit_menu = new UICanvas();
    edit_menu.enabled = false;

    element = new Element(
        context,
        new Vector(),
        new Vector(canvas.width, canvas.height),
        "rgb(0,0,0,0.5)"
    );
    edit_menu.set("dimming_box", element);

    element = new Element(
        context,
        new Vector(50, 150),
        new Vector(canvas.width - 100, canvas.height - 500),
        "lightcoral"
    );
    element.set_outline("indianred", 8);
    edit_menu.set("background", element);

    element = new Button(
        context,
        new RelativeVector(
            edit_menu.get("background").bounds[1],
            edit_menu.get("background").bounds[0],
            new Vector(-40,10)
        ),
        "azure",
        "x",
        "bold 30px monospace",
        "indianred",
        new Vector(10,5),
        new Vector(0,-2.5)
    );
    element.pos.x -= element.text_dimensions.x
    element.set_outline("indianred", 2);
    element.on_click(_ => edit_menu.enabled = false);
    edit_menu.set("close", element);

    element = new TextBox(
        context,
        new RelativeVector(
            edit_menu.get("background").bounds[0],
            edit_menu.get("background").bounds[0],
            new Vector(50,25)
        ),
        new RelativeVector(
            edit_menu.get("close").bounds[0],
            new Vector(),
            new Vector()
        ),
        "40px monospace",
        "azure",
        "indianred",
        undefined,
        "insert name...",
        "lightcoral"
    );
    element.dimensions.relative_vector_i = new RelativeVector(
        element.bounds[0], 
        new Vector(50)
    );
    element.dimensions.invert_i = true;
    element.dimensions.bound_vector_j = new RelativeVector(
        element.text_dimensions,
        new Vector(0,15)
    );
    edit_menu.set("level_name", element);

    element = new Text(
        context,
        new RelativeVector(
            edit_menu.get("level_name").bounds[0],
            edit_menu.get("level_name").bounds[1],
            new Vector()
        ),
        `0/${NAME_MAX_CHARS}`,
        "15px monospace",
        "indianred"
    );
    element.pos.relative_vector_j = new RelativeVector(
        element.text_dimensions,
        new Vector(0,5)
    );
    edit_menu.set("level_name_length", element);

    element = new Button(
        context,
        new RelativeVector(
            edit_menu.get("background").bounds[0],
            edit_menu.get("level_name_length").bounds[1],
            new Vector(50,30)
        ),
        "azure",
        "export",
        "20px monospace",
        "indianred",
        new Vector(15,15)
    );
    element.set_outline("indianred", 2);
    element.on_click(_ => {
        current_level.name = edit_menu.get("level_name").value;
        if (current_level.name === "") current_level.name = "unnamed_level";
        Level.export(current_level);
    });
    edit_menu.set("export", element);

    element = new Button(
        context,
        new RelativeVector(
            edit_menu.get("export").bounds[0],
            edit_menu.get("export").bounds[1],
            new Vector(0,15)
        ),
        "azure",
        "import",
        "20px monospace",
        "lightpink",
        new Vector(15,15)
    );
    element.set_outline("lightpink", 2);
    element.on_click(_ => level_uploader.click());
    edit_menu.set("import", element);
}

function create_main_menu() {
    let element;
    main_menu = new UICanvas();
    
    element = new Button(
        context,
        new Vector(5,5),
        "darkorchid",
        current_layer,
        "15px Arial",
        "white",
        new Vector(10,10)
    );
    element.on_click(self => {
        let i = (LAYERS.indexOf(current_layer) + 1) % LAYERS.length; 
        current_layer = LAYERS[i];
        self.text = current_layer;
    });
    main_menu.set("layer_select", element);

    show_all_layers = true;
    element = new Button(
        context,
        new RelativeVector(
            main_menu.get("layer_select").bounds[1],
            main_menu.get("layer_select").bounds[0],
            new Vector(5,2)
        ),
        "darkmagenta",
        "𓁹",
        "15px Arial",
        "white",
        new Vector(5,5),
        new Vector(0,-1.5)
    );
    element.set_outline("darkmagenta", 2);
    element.on_click(self => {
        show_all_layers = !show_all_layers;
        self.text = (show_all_layers) ? "𓁹" : "𓂃";
        self.colour = (show_all_layers) ? "darkmagenta" : "azure";
        self.text_colour = (show_all_layers) ? "azure" : "darkmagenta";
        self.offset = (show_all_layers) ? new Vector(0,-1.5) : new Vector(0,-3.5);
    });
    main_menu.set("layer_view", element);

    edit_menu.enabled = false;
    element = new Button(
        context,
        new RelativeVector(
            main_menu.get("layer_view").bounds[1],
            main_menu.get("layer_select").bounds[0],
            new Vector(5,1)
        ),
        "mediumvioletred",
        "✎",
        "15px Arial",
        "azure",
        new Vector(7,7)
    );
    element.on_click(self => edit_menu.enabled = true);
    main_menu.set("level_edit", element);

    dropdown_menu.enabled = false;
    element = new Button(
        context,
        new RelativeVector(
            main_menu.get("layer_select").bounds[0],
            main_menu.get("layer_select").bounds[1],
            new Vector(0,5)
        ),
        "blueviolet",
        "˯",
        "30px Arial",
        "azure",
        new Vector(10),
        new Vector(0,-14)
    );
    element.set_outline("blueviolet", 2);
    element.on_click(self => {
        dropdown_menu.enabled = !dropdown_menu.enabled;
        self.text = "˯";
        self.text_colour = "azure";
        self.colour = "blueviolet";
    
        if (dropdown_menu.enabled) {
            self.text = "˰";
            self.text_colour = "blueviolet";
            self.colour = "azure";
            dropdown_menu.set("page", generate_dropdown_page(0));
        }
    });
    main_menu.set("tile_dropdown", element);
}

function draw() {
    request = window.requestAnimationFrame(draw);
    let current = Date.now();
    let elapsed = current - last;

    edit_menu.get("level_name").cursor_accumulator(elapsed);

    if (elapsed <= INTERVAL) return;
    last = current - (elapsed % INTERVAL);;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (current_level === null) return; 
    
    //draw layers
    for (let layer of LAYERS) {
        if (show_all_layers) current_level.draw_layer(layer);

        //draw edit grid lines
        if (layer == current_layer) {
            if (!show_all_layers) current_level.draw_layer(layer);
            let max_col_tiles = Math.floor(canvas.height / relative_tilesize);
            let max_row_tiles = Math.floor(canvas.width / relative_tilesize);
            
            context.strokeStyle = "black";
            context.lineWidth = 0.25;
            context.beginPath();
            for (let c=0; c<max_col_tiles; c++) {
                context.moveTo(c*relative_tilesize, 0);
                context.lineTo(c*relative_tilesize, canvas.height);
            }
            for (let r=0; r<max_row_tiles; r++) {
                context.moveTo(0, r*relative_tilesize);
                context.lineTo(canvas.width, r*relative_tilesize);
            }
            context.stroke();
        }
    }

    //draw spawn
    context.strokeStyle = "blue";
    context.lineWidth = 4;
    context.strokeRect(...current_level.spawn, relative_tilesize, relative_tilesize);

    //draw enemies
    context.strokeStyle = "red";
    context.lineWidth = 2;
    for (const enemy_spawn of current_level.enemy_spawns) {
        context.strokeRect(...enemy_spawn, relative_tilesize, relative_tilesize);
    }

    main_menu.draw();
    dropdown_menu.draw();
    edit_menu.draw();
}

function mousemove(event) {
    //update mouse position
    let relative_x = event.clientX - canvas.offsetLeft;
    let relative_y = event.clientY - canvas.offsetTop;
    let mouse_pos = new Vector(relative_x, relative_y);
    if (relative_x < 0 || relative_x > canvas.width) mouse_pos = null;
    if (relative_y < 0 || relative_y > canvas.height) mouse_pos = null;
    mouse.pos = mouse_pos;

    //set tile/drag set tile
    if (!mouse.lclick && !mouse.rclick) return;
    if (mouse === null) return;
    if (mouse.pos === null) return;
    if (current_level === null) return;

    let tile_x = Math.floor(mouse.pos.x / relative_tilesize);
    let tile_y = Math.floor(mouse.pos.y / relative_tilesize);

    if (mouse.lclick) {
        let coords = new Vector(tile_x*relative_tilesize, tile_y*relative_tilesize);
        switch(current_tile) {
            case "spawn":
                current_level.spawn = coords;
                break;
            case "+ enemy":
                current_level.enemy_spawns.push(coords);
                break;
            case "- enemy":
                current_level.enemy_spawns = current_level.enemy_spawns.filter(spawn => {
                    if (!(spawn.x === coords.x && spawn.y === coords.y)) {
                        return spawn;
                    }
                });
                break;
            default:
                current_level[current_layer][tile_y][tile_x] = current_tile;
                break;
        }
    }
    if (mouse.rclick) {
        current_level[current_layer][tile_y][tile_x] = TILES.empty.name;
    }
}

function click(event) {
    event.preventDefault();

    let has_clicked_ui;
    has_clicked_ui = edit_menu.check_collisions(mouse.pos);
    if (edit_menu.enabled) return;
    has_clicked_ui = has_clicked_ui || main_menu.check_collisions(mouse.pos)
    has_clicked_ui = has_clicked_ui || dropdown_menu.get("page").check_collisions(mouse.pos);
    if (has_clicked_ui) return;

    switch (event.button) {
        case 0:
        case 1:
            mouse.lclick = true;
            mousemove(event);
            break;
        case 2:
            mouse.rclick = true;
            break;
    }
}

function unclick(event) {
    event.preventDefault();
    switch (event.button) {
        case 0:
        case 1:
            mouse.lclick = false;
            break;
        case 2:
            mouse.rclick = false;
            break;
    }
}

function press(event) {
    event.preventDefault();

    const key = event.key.toLowerCase();
    const level_name_textbox = edit_menu.get("level_name")

    if (edit_menu.enabled && level_name_textbox.editing) {
        if (NAME_LEGAL_CHARS.includes(key) && level_name_textbox.value.length < NAME_MAX_CHARS) {
            level_name_textbox.value += key;
        }
        switch (key) {
            case "backspace":
                level_name_textbox.value = level_name_textbox.value.slice(0, level_name_textbox.value.length - 1);
                break;
            case "enter":
                level_name_textbox.editing = false;
                break;
        }
        edit_menu.get("level_name_length").text = `${level_name_textbox.value.length}/${NAME_MAX_CHARS}`;
    }

    switch (key) {
        case "uparrow":
            break;
        case "leftarrow":
            break;
        case "downarrow":
            break;
        case "rightarrow":
            break;
    }
}

function unpress(event) {

}