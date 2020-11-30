import { max, min } from 'lodash';
import * as PIXI from 'pixi.js';
import * as Victor from 'victor'
import { RainbowShader } from '../shader/rainbowShader';

export class Boid extends PIXI.Graphics {

    constructor(x,y,maxX, maxY, width = 10) {
        super();

        this.x = x;
        this.y = y;
        this.maxX = maxX+width;
        this.maxY = maxY+width;
        this.minX = 0 - width;
        this.minY = 0 - width;
  
        this.c = new RainbowShader(1.5)
        this.w = width

        // Drawing the pointer
        this.triangle(this.w,this.w,this.c.getColor())

        this.vectorFollow = new Victor(0,0)
        this.pointAt(this.x + (Math.random() * 2) -1, this.y + (Math.random() * 2) -1)

        window.addEventListener("mousemove", e => this.pointAt(e.clientX, e.clientY), false);
    }

    pointAt(x,y) {
        var vectorPosition = new Victor(this.x, this.y)
        var vectorTarget = vectorPosition.subtract(new Victor(x,y)).normalize()
        this.vectorFollow = vectorTarget
        this.rotation = this.vectorFollow.direction()
    }

    update(delta) {
        var v = new Victor(this.x, this.y)
            .add(this.vectorFollow.clone().multiplyScalar(delta * -2))

        this.x = v.x % this.maxX;
        this.y = v.y % this.maxY;
        if (this.x < this.minX) {
            this.x = this.maxX
        }
        if (this.y < this.minY) {
            this.y = this.maxY
        }
        this.c.nextColor(delta)
        this.triangle(this.w, this.w, this.c.getColor())
    }

    triangle(w,h,color) {
        this.clear()
        this.beginFill(color, 1);
        this.lineStyle(0, color, 1);
        this.moveTo(w, h);
        this.lineTo(-1 * w, 0); 
        this.lineTo(w, -1 * h);
        this.lineTo(0.5 * w, 0);
        this.lineTo(w, h);
        this.endFill();
    }
}

var nextColor = (color) => {
    
    return color + 1
}