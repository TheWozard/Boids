import * as PIXI from 'pixi.js';

export interface ButtonParams {
    x: number, y: number,
    scale: number,
    padding: number,
    color: number,
    text: string,
}

export class Button extends PIXI.Container {

    constructor(params: ButtonParams, onClick: () => void) {
        super();

        this.x = params.x
        this.y = params.y

        const text: PIXI.Text = new PIXI.Text(params.text, { fontFamily: 'Arial', fontSize: params.scale, fill: params.color, align: 'center' });
        text.x = params.padding;
        text.y = params.padding;
        const button: PIXI.Graphics = new PIXI.Graphics()
        button.lineStyle(0, params.color, 1)
        button.beginFill(params.color, 0.2)
        button.drawRect(0, 0, text.width + (2 * params.padding), text.height + (2 * params.padding))
        button.endFill()
        this.addChild(button)
        this.addChild(text)

        this.interactive = true
        this.buttonMode = true

        this.on("pointertap", (event: any) => {
            onClick()
        })
    }
}