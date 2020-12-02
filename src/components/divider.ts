import * as PIXI from 'pixi.js';

export interface DividerParams {
    height: number;
    width: number;
    color: number;
}

export class Divider extends PIXI.Graphics {

    constructor(params: DividerParams) {
        super();

        this.lineStyle(0, params.color, 1);
        this.drawRect(0,0,params.width,params.height)
        this.lineStyle(1, params.color, 0.2);
        this.moveTo(0, params.height/2)
        this.lineTo(params.width, params.height/2)
    }
}