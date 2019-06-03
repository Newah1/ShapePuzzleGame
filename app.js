

const app = new PIXI.Application({resizeTo: window});

document.body.appendChild(app.view);

const stage = app.stage;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// x y
const grid_size = [10, 20];
let grid_pixel_width = 24;
const assets_folder = "assets/";
let tick_rate = 100;


const SHAPES = {
    T : [
        [
            ['0','1','0'],
            ['1','1','1']
        ],
        [
            ['1','0'],
            ['1','1'],
            ['1','0']
        ],
        [
            ['1','1','1'],
            ['0','1','0']
        ],
        [
            ['0','1'],
            ['1','1'],
            ['0','1']
        ]
    ],
    SQUARE : [
        [
            ['1','1'],
            ['1', '1']
        ]   
    ],
    STICK : [
        [
            ['1'],
            ['1'],
            ['1'],
            ['1']
        ],
        [
            ['1','1','1','1']
        ]
    ],
    L_LEFT: [
        [
            ['1','0'],
            ['1','0'],
            ['1','1']
        ],
        [
            ['1','1','1'],
            ['1','0','0']
        ],
        [
            ['1','1'],
            ['0','1'],
            ['0','1']
        ]
    ],
    L_RIGHT: [
        [
            ['0','1'],
            ['0','1'],
            ['1','1']
        ],
        [
            ['1','0','0'],
            ['1','1','1']
        ],
        [
            ['1','1'],
            ['1','0'],
            ['1','0']
        ]
    ],
    DOG_LEFT: [
        [
            ['1','1','0'],
            ['0','1','1']
        ],
        [
            ['0','1'],
            ['1','1'],
            ['1','0']
        ]
    ],
    DOG_RIGHT: [
        [
            ['0','1','1'],
            ['1','1','0']
        ],
        [
            ['1','0'],
            ['1','1'],
            ['0','1']
        ]
    ]
};

PIXI.sound.add("hit",`${assets_folder}hit.wav`);

class Field {

    constructor(width, height){
        this.width = width;
        this.height = height;
        this.rect = new PIXI.Rectangle();
        this.graphics = new PIXI.Graphics();
        this.calculate_area();
        stage.addChild(this.graphics);
    }

    render(){        
        this.calculate_area();
        this.graphics.clear()
        this.graphics.beginFill(0xFFFFFF);
        this.graphics.drawRect(this.x, this.y, this.actual_width, this.actual_height);
        this.graphics.endFill();
        
    }

    calculate_area(){
        this.x = (app.renderer.width / 2) - ((this.width * grid_pixel_width) / 2);
        this.y = 0;
        this.actual_width = this.width * grid_pixel_width;
        this.actual_height = this.height * grid_pixel_width;    
        return true;
    }

    get_pos_y(y){
        return this.y + (y * grid_pixel_width);
    }

    get_pos_x(x){
        return this.x + (x * grid_pixel_width);
    }
}


class Grid{
    constructor(width, height){
        console.log(width, height);
        this.grid = [];
        this.width = width, this.height = height;
        this.populate();
    }

    populate(){
        for(let x = 0; x < this.width; x++){
            this.grid.push([]);
            for (let y = 0; y < this.height; y++){                
                this.grid[x].push(0);
            }
        }
    }
    add(shape){
        for(let y = 0; y < shape.shape[shape.rotation].length; y++){
            for(let x = 0; x < shape.shape[shape.rotation][0].length; x++){                
                if(shape.shape[shape.rotation][y][x] == 1){
                    this.grid[(shape.x + x)][(shape.y + y)] = 1;
                }
            }
        }
    }

    loop_through_grid(callback){
        for(let x = 0; x < this.width; x++){
            for(let y = 0; y < this.height; y++){
                callback(this.grid[x][y], x, y);
            }
        }
    }

    move_down_line(y_line){
        console.log("move down a line", y_line);
        for(let shape of shapes){
            for(let key in shape.blocks){
                let block = shape.blocks[key];
                let y_level = block.y + shape.y;
                if(y_level == y_line){
                    shape.blocks.splice(key,1);
                    stage.removeChild(block.sprite);
                    block.sprite.destroy();
                }
            }
        }
        for(let shape of shapes){
            for(let block of shape.blocks){
                if((block.y+shape.y) > y_line){
                    block.set_pos(block.x, block.y+1);
                }
            }
        }

    }
    check_line(){
        let last_x = 0;
        let in_a_row = 0;
        this.loop_through_grid((grid_item, x, y) => {
            if(last_x == x && grid_item > 0){
                in_a_row++;
                if(in_a_row == grid_size[0]){
                    this.move_down_line(y);
                }
            } else if (last_x != x){
                in_a_row = 0;
            }

            last_x = x;
        });
    }
}

let grid = new Grid(grid_size[0], grid_size[1]);

class Block {
    constructor(x, y, color, shape){
        this.x = x;
        this.y = y;
        this.shape = shape;
        this.sprite = PIXI.Sprite.from(assets_folder + "block.png");
        this.sprite.anchor.set(0,0);
        this.sprite.tint = color;
        this.active = true;
        this.set_pos(x,y);
        stage.addChild(this.sprite);
    }

    set_pos(x,y){
        this.x = x, this.y = y;
        
        this.sprite.position.x = this.shape.actual_x + (x * grid_pixel_width);
        this.sprite.position.y = this.shape.actual_y + (y * grid_pixel_width);
    }
    render(){
        if(this.active){
        // this.sprite.tint = Math.random() * 0xFFFFFF;
        this.set_pos(this.x,this.y);
        this.sprite.width = grid_pixel_width;
        this.sprite.height = grid_pixel_width;
        }
    }
    // Check if you're out of bounds, horizontally.
    out_of_bounds(x){
        if(x < 0){
            return true;
        }
        if(this.x + (x) + 1 > grid_size[0]){
            return true;
        }
        return false;
    }
    ground_check(y,x){
        if(this.y + (y + 1) > grid_size[1]){
            return true;
        }
        if(typeof grid.grid[this.x + x] !== "undefined" && typeof grid.grid[this.x + x][this.y + y] !== "undefined"){
            if(grid.grid[this.x + x][this.y + y] == 1){
                return true;
            }
        }
        
        return false;
    }
}

class Shape{

    constructor(shape, x, y){
        console.log(shape, x,y);
        this.active = true;
        this.blocks = [];
        this.x = x;
        this.y = y;
        let shape_size = 4;
        this.random_color = Math.random() * 0xFFFFFF;
        this.rotation = 0;
        //this.set_pos(x,y);
        this.dt = 0;

        this.create_shape(shape);
    }

    create_shape(shape){
        this.shape = SHAPES[shape];
        this.shape_key = shape;
        
        if(this.blocks.length > 0){
            for(let block of this.blocks){
                block.active = false;
                stage.removeChild(block.sprite);
                block.sprite.destroy();
            }
        }
        this.blocks = [];
        
        for(let x = 0; x < this.shape[this.rotation][0].length; x++){
            for(let y = 0; y < this.shape[this.rotation].length; y++){
                if(this.shape[this.rotation][y][x] == 1){
                    let block = new Block(x, y, this.random_color, this);
                    this.blocks.push(block);
                }
            }
        }
    }
    rotate(){
        this.rotation++;
        if(this.rotation > this.shape.length -1){
            this.rotation = 0;
        }
    }

    set_pos(x,y){
        this.actual_x = field.get_pos_x(this.x);
        this.actual_y = field.get_pos_y(this.y);
        for(let block of this.blocks){
            if(block.out_of_bounds(x)){
                return false;
            }
            if(block.ground_check(y, x)){
                this.set_inactive();
                return false;
            }
        }
        this.x = x, this.y = y;
        this.actual_x = field.get_pos_x(x);
        this.actual_y = field.get_pos_y(y);
    }

    set_inactive(){

        if(this.is_active()){
            PIXI.sound.play("hit");
            active_shape = Shape.random_shape();
            shapes.push(active_shape);
            this.active = false;
            this.set_in_grid();
        }
        
        try{
            let line = 0;
            if(line = grid.check_line()){
                //grid.move_down_line(line);
            }
            
        }catch(error){
            console.warn(error);
        }
       
        
    }

    set_in_grid(){
        grid.add(this);
        console.log(grid.grid);
    }

    update(){
        // this.y += 1;
        this.set_pos(this.x, this.y+1);
    }

    is_active(){
        return this.active;
    }

    render(){   
        if(this.is_active() && this.dt > tick_rate){
            this.update();
            this.dt = 0;
        }    
        this.dt += app.ticker.deltaMS;
        this.set_pos(this.x, this.y);
        for(let block of this.blocks){
            block.render();
        }
    }

    static random_shape(){ // get a random shape and return it
        let rand = Math.floor(Math.random() * Object.keys(SHAPES).length);
        let index = 0;
        for(let shape in SHAPES){
            if(index === rand){
                return new Shape(shape,0,0);
            }
            index++;
        }
    }
    
}


class InputManager{

    constructor(){
        let _this = this;
        document.addEventListener("keydown", ev => {
            
            _this.key_down(ev.keyCode);
        });
    }

    key_down(keycode){
        if(keycode === 39){
            //right
            this.right_left(1);
        } else if (keycode === 37){
            //left
            this.right_left(-1);
        } else if (keycode === 38){
            this.rotate();
        }

    }

    rotate(){
        active_shape.rotate();
        console.log(active_shape);

        active_shape.create_shape(active_shape.shape_key);
    }

    down(){

    }

    right_left(right_or_left){
        if(active_shape.is_active()){
            active_shape.set_pos(active_shape.x + right_or_left, active_shape.y);
        }
    }

}



let field = new Field(grid_size[0], grid_size[1]);
let shapes =[]; 
shapes.push (new Shape("SQUARE", 0, 0));

let active_shape = shapes[0]; 

new InputManager();

class Renderer{

    constructor(){

    }

    static render(){
        grid_pixel_width = app.renderer.width / 50;
        if(grid_pixel_width < 24){
            grid_pixel_width = 24;
        }
        //app.renderer.resize(window.innerWidth, window.innerHeight);
        app.render(stage);
        

        field.render();

        for (let shape of shapes){
            shape.render();        
        }
        

        //requestAnimationFrame(Renderer.render());
    }


}


app.ticker.add(() => {
    
    Renderer.render();
});