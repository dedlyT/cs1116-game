import { Vector, is_colliding } from "./mymath.js";
import { Level, TILES } from "./levels.js";

let canvas;
let context;
let request;

const FPS = 30;
const INTERVAL = 1000 / FPS;
let last = Date.now();

let current_level;
let current_name = "";
const LAYERS = ["background", "middleground", "foreground"];
const LEGAL_CHARS = "abcdefghijklmnopqrstuvwxyz_"
let current_layer = 0;
let current_tile = TILES.woodwall.name;
let show_all_layers = true;
let relative_tilesize = 25;
let relative_offset = new Vector();

const mouse = {lclick: false, rclick: false, pos: null};
const ui_bounds = {
    layer: [new Vector(5,5), new Vector()],
    view_all: [new Vector(), new Vector()],
    open_edit_menu: [new Vector(), new Vector()],
    dropdown: [new Vector(5), new Vector()],
    dropdown_items: [],
    close_edit_menu: [new Vector(), new Vector()],
    level_name: [new Vector(), new Vector()],
    export: [new Vector(), new Vector()],
    import: [new Vector(), new Vector()]
};
const ui_settings = {
    dropdown_open: false,
    dropdown_page: 0,
    dropdown_max: 20,
    edit_menu_open: false,
    editing_name: false,
    editing_name_cursor_shown: false,
    editing_name_cursor_blink_interval: 1250, 
    editing_name_cursor_blink_accumulator: 0,
    name_max_length: 20
};

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    current_level = new Level();

    window.addEventListener("mousemove", mousemove, false);
    window.addEventListener("mousedown", click, false);
    window.addEventListener("mouseup", unclick, false);
    window.addEventListener("keydown", press, false);
    window.addEventListener("keyup", unpress, false);
    draw();
}

function draw() {
    request = window.requestAnimationFrame(draw);
    let current = Date.now();
    let elapsed = current - last;

    if (ui_settings.editing_name) {
        ui_settings.editing_name_cursor_blink_accumulator += elapsed;
        if (ui_settings.editing_name_cursor_blink_accumulator >= ui_settings.editing_name_cursor_blink_interval) {
            ui_settings.editing_name_cursor_blink_accumulator = 0;
            ui_settings.editing_name_cursor_shown = !ui_settings.editing_name_cursor_shown;
        }
    }

    if (elapsed <= INTERVAL) return;
    last = current - (elapsed % INTERVAL);;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (current_level === null) return; 
    
    //draw layers
    for (let layer of LAYERS) {
        if (show_all_layers) current_level.draw_layer(context, layer);

        //draw edit grid lines
        if (layer == LAYERS[current_layer]) {
            if (!show_all_layers) current_level.draw_layer(context, layer);
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
    
    let dimensions = new Vector();
    let text_size;

    //current layer button
    context.fillStyle = "darkorchid";
    context.font = "15px Arial";
    text_size = context.measureText(LAYERS[current_layer]);
    dimensions.x = text_size.width+10;
    dimensions.y = text_size.hangingBaseline+10;
    ui_bounds.layer[1].x = ui_bounds.layer[0].x + dimensions.x;
    ui_bounds.layer[1].y = ui_bounds.layer[0].y + dimensions.y;
    context.fillRect(...ui_bounds.layer[0], ...dimensions);
    context.fillStyle = "white";
    context.fillText(LAYERS[current_layer], ui_bounds.layer[0].x+5, ui_bounds.layer[0].y + text_size.hangingBaseline + 4);
    
    //view layers button
    ui_bounds.view_all[0].x = ui_bounds.layer[1].x+5;
    ui_bounds.view_all[0].y = ui_bounds.layer[0].y+2;
    let view_all_text = (show_all_layers) ? "𓁹" : "𓂃";
    context.fillStyle = (show_all_layers) ? "darkmagenta" : "azure";
    text_size = context.measureText(view_all_text);
    dimensions.x = text_size.width+5;
    dimensions.y = text_size.hangingBaseline+5;
    context.fillRect(...ui_bounds.view_all[0], ...dimensions);
    context.strokeStyle = "darkmagenta";
    context.lineWidth = 2;
    context.strokeRect(...ui_bounds.view_all[0], ...dimensions);
    context.fillStyle = (show_all_layers) ? "azure" : "darkmagenta";
    context.fillText(
        view_all_text, 
        ui_bounds.view_all[0].x+2.5, 
        ui_bounds.view_all[0].y + text_size.hangingBaseline + (show_all_layers ? 1 : -1));
    ui_bounds.view_all[1].x = ui_bounds.view_all[0].x + dimensions.x;
    ui_bounds.view_all[1].y = ui_bounds.view_all[0].y + dimensions.y;

    //edit level data button
    ui_bounds.open_edit_menu[0].x = ui_bounds.view_all[1].x+5;
    ui_bounds.open_edit_menu[0].y = ui_bounds.layer[0].y+1;
    text_size = context.measureText("✎");
    dimensions.x = text_size.width+7;
    dimensions.y = text_size.hangingBaseline+7;
    context.fillStyle = "mediumvioletred";
    context.fillRect(...ui_bounds.open_edit_menu[0], ...dimensions);
    context.fillStyle = "azure";
    context.fillText("✎", ui_bounds.open_edit_menu[0].x+3, ui_bounds.open_edit_menu[0].y + text_size.hangingBaseline + 4);
    ui_bounds.open_edit_menu[1].x = ui_bounds.open_edit_menu[0].x + dimensions.x;
    ui_bounds.open_edit_menu[1].y = ui_bounds.open_edit_menu[0].y + dimensions.y;

    //dropdown button
    context.font = "30px Arial";
    let dropdown_text = (ui_settings.dropdown_open) ? "˰" : "˯";
    let dropdown_colour = (ui_settings.dropdown_open) ? "azure" : "blueviolet";
    let dropdown_text_colour = (ui_settings.dropdown_open) ? "blueviolet" : "azure";
    text_size = context.measureText(dropdown_text);
    context.fillStyle = dropdown_colour;
    context.strokeStyle = "blueviolet";
    context.lineWidth = 2;
    ui_bounds.dropdown[0].y = ui_bounds.layer[1].y+5;
    dimensions.x = text_size.width+10;
    dimensions.y = text_size.hangingBaseline;
    ui_bounds.dropdown[1].x = ui_bounds.dropdown[0].x + dimensions.x;
    ui_bounds.dropdown[1].y = ui_bounds.dropdown[0].y + dimensions.y;
    context.fillRect(...ui_bounds.dropdown[0], ...dimensions);
    context.strokeRect(...ui_bounds.dropdown[0], ...dimensions);
    context.fillStyle = dropdown_text_colour;
    context.fillText(dropdown_text, ui_bounds.dropdown[0].x+5, ui_bounds.dropdown[0].y+8);

    //dropdown items (tiles)
    if (ui_settings.dropdown_open) {
        context.font = "15px Arial";
        let current_pos = new Vector(ui_bounds.dropdown[0].x, ui_bounds.dropdown[1].y+5);
        let i=0;
        for (let tile in TILES) {
            if (i < ui_settings.dropdown_page * ui_settings.dropdown_max) return;
            if (i > ui_settings.dropdown_max + ui_settings.dropdown_page * ui_settings.dropdown_max) break;

            text_size = context.measureText(tile);
            dimensions.x = text_size.width + 10;
            dimensions.y = text_size.hangingBaseline + 10;
            context.fillStyle = "darkslateblue";
            context.fillRect(...current_pos, ...dimensions);

            context.fillStyle = "azure";
            if (tile === current_tile) {
                context.strokeStyle = "plum";
                context.lineWidth = 2;
                context.strokeRect(...current_pos, ...dimensions);
                context.fillStyle = "plum";
            }
            context.fillText(tile, current_pos.x+5, current_pos.y+15);

            ui_bounds.dropdown_items.push([ new Vector(...current_pos), 
                                            new Vector(current_pos.x + dimensions.x, current_pos.y + dimensions.y),
                                            tile ]);
            current_pos.y += dimensions.y + 5;
            i++;
        }
    }

    if (ui_settings.edit_menu_open) {
        //black dimming background
        context.fillStyle = "rgb(0,0,0,0.5)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        //main window
        context.fillStyle = "lightcoral";
        dimensions.x = canvas.width-100;
        dimensions.y = canvas.height-500;
        const edit_menu_pos = new Vector(50, 150);
        const edit_menu_dimensions = new Vector(...dimensions);
        context.fillRect(...edit_menu_pos, ...dimensions);
        context.strokeStyle = "indianred"
        context.lineWidth = 8;
        context.strokeRect(...edit_menu_pos, ...dimensions);

        //close button
        context.font = "bold 30px monospace";
        text_size = context.measureText("x");
        ui_bounds.close_edit_menu[0].x = edit_menu_pos.x + edit_menu_dimensions.x - text_size.width - 20;
        ui_bounds.close_edit_menu[0].y = edit_menu_pos.y + 10;
        dimensions.x = text_size.width + 10;
        dimensions.y = text_size.hangingBaseline + 5;
        context.fillStyle = "azure";
        context.fillRect(...ui_bounds.close_edit_menu[0], ...dimensions);
        context.lineWidth = 2;
        context.strokeRect(...ui_bounds.close_edit_menu[0], ...dimensions);
        context.fillStyle = "indianred";
        context.fillText("x", ui_bounds.close_edit_menu[0].x+5, ui_bounds.close_edit_menu[0].y + text_size.hangingBaseline);
        ui_bounds.close_edit_menu[1].x = ui_bounds.close_edit_menu[0].x + dimensions.x;
        ui_bounds.close_edit_menu[1].y = ui_bounds.close_edit_menu[0].y + dimensions.y;

        //level name text box
        ui_bounds.level_name[0].x = edit_menu_pos.x + 50;
        ui_bounds.level_name[0].y = edit_menu_pos.y + 25;
        context.font = "40px monospace";
        text_size = context.measureText(LEGAL_CHARS + "|");
        dimensions.x = (edit_menu_dimensions.x - dimensions.x - 100);
        dimensions.y = text_size.hangingBaseline + 15;
        context.fillRect(...ui_bounds.level_name[0], ...dimensions);
        let shown_text = current_name;
        context.fillStyle = "azure";
        if (!ui_settings.editing_name && current_name === "") {
            shown_text = "insert name...";
            context.fillStyle = "lightcoral";
        }
        context.fillText(
            shown_text, 
            ui_bounds.level_name[0].x+5, 
            ui_bounds.level_name[0].y + text_size.hangingBaseline + 7.5
        );
        
        if (ui_settings.editing_name && ui_settings.editing_name_cursor_shown) {
            //cursor in text box
            text_size = context.measureText(shown_text);
            context.font = "38px monospace";
            context.fillStyle = "lightcoral";
            context.fillText(
                "|",
                ui_bounds.level_name[0].x + text_size.width,
                ui_bounds.level_name[0].y + text_size.hangingBaseline + 2
            );
        }

        ui_bounds.level_name[1].x = ui_bounds.level_name[0].x + dimensions.x;
        ui_bounds.level_name[1].y = ui_bounds.level_name[0].y + dimensions.y;

        //level name max length text
        context.font = "15px monospace";
        let length_text = `${current_name.length}/${ui_settings.name_max_length}`;
        text_size = context.measureText(length_text);
        context.fillStyle = "indianred";
        context.fillText(
            length_text,
            ui_bounds.level_name[0].x,
            ui_bounds.level_name[1].y + text_size.hangingBaseline + 5
        );
    }
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
        current_level[LAYERS[current_layer]][tile_y][tile_x] = current_tile;
    }
    if (mouse.rclick) {
        current_level[LAYERS[current_layer]][tile_y][tile_x] = TILES.empty.name;
    }
}

function click_UI() {
    if (mouse.pos === null) return;

    const generate_box = (bounds) => { return { x:bounds[0].x, y:bounds[0].y, 
                                        width:bounds[1].x - bounds[0].x, height:bounds[1].y - bounds[0].y} };
    
    const mouse_pos = mouse.pos;

    if (ui_settings.edit_menu_open) { 
        if (is_colliding(mouse_pos, generate_box(ui_bounds.close_edit_menu))) {
            ui_settings.edit_menu_open = false;
        }

        if (is_colliding(mouse_pos, generate_box(ui_bounds.level_name))) {
            ui_settings.editing_name = true;
            ui_settings.editing_name_cursor_shown = true;
            ui_settings.editing_name_cursor_blink_accumulator = 0;
        } else {
            ui_settings.editing_name = false;
        }

        return true;
    }

    if (is_colliding(mouse_pos, generate_box(ui_bounds.layer))) {
        current_layer = (current_layer + 1) % LAYERS.length;
    }

    if (is_colliding(mouse_pos, generate_box(ui_bounds.view_all))) {
        show_all_layers = !show_all_layers;
    }

    if (is_colliding(mouse_pos, generate_box(ui_bounds.open_edit_menu))) {
        ui_settings.edit_menu_open = true;
    }

    if (is_colliding(mouse_pos, generate_box(ui_bounds.dropdown))) {
        ui_settings.dropdown_open = !ui_settings.dropdown_open;
        return true;
    }

    for (let bounds of ui_bounds.dropdown_items) {
        if (is_colliding(mouse_pos, generate_box(bounds))) {
            current_tile = bounds[2];
            return true;
        }
    }
}

function click(event) {
    event.preventDefault();

    let has_clicked_ui = click_UI();
    if (has_clicked_ui) return;

    switch (event.button) {
        case 0:
        case 1:
            mouse.lclick = true;
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

    let key = event.key.toLowerCase();

    if (ui_settings.editing_name) {
        if (LEGAL_CHARS.includes(key) && current_name.length < ui_settings.name_max_length) {
            current_name += key;
            return;
        }
        switch (key) {
            case "backspace":
                current_name = current_name.slice(0, current_name.length - 1);
                break;
            case "enter":
                ui_settings.editing_name = false;
                break;
        }
    }
}

function unpress(event) {

}