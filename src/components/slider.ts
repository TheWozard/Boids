import * as PIXI from 'pixi.js';

export interface SliderParams {
    min: number, max: number,
    width: number, height: number, padding: number,
    color: number, title: string,
}

export class Slider extends PIXI.Container {

    private params: SliderParams;
    private barStartX: number;

    private dot: PIXI.Graphics;

    constructor(params: SliderParams, onChange: (value: number) => void, initial: number) {
        super();

        this.params = params

        const title: PIXI.Text = new PIXI.Text(params.title, { fontFamily: 'Arial', fontSize: params.height, fill: params.color, align: 'center' });
        this.addChild(title)

        this.barStartX = params.padding

        const barStartY = params.height
        const fullPadding = (2 * params.padding)
        const barHeight = params.height / 3

        // Drawing the bar to slide on
        const bar: PIXI.Graphics = new PIXI.Graphics()
        bar.lineStyle(0, params.color, 1)
        bar.beginFill(params.color, 0.2)
        bar.drawRect(0, 0, params.width + fullPadding, params.height + fullPadding)
        bar.endFill()
        bar.beginFill(params.color, 0.4)
        bar.drawRect(this.barStartX, barHeight + params.padding, params.width, barHeight)
        bar.endFill()
        bar.y = barStartY
        this.addChild(bar)

        // Drawing the dot to slide
        this.dot = new PIXI.Graphics()
        this.dot.lineStyle(0, 0xFFFFFF, 1)
        this.dot.beginFill(0xFFFFFF, 1)
        this.dot.drawCircle(0, params.height/2, params.height/2)
        this.dot.endFill()
        this.addChild(this.dot)

        const textStart = params.height + fullPadding + barStartY

        // Drawing extra text
        const valueText: PIXI.Text = new PIXI.Text("" + initial, { fontFamily: 'Arial', fontSize: params.height, fill: params.color, align: 'center' });
        valueText.y = textStart
        valueText.x = (params.width / 2) - (valueText.width / 2) + params.padding
        this.addChild(valueText)
        const minText: PIXI.Text = new PIXI.Text("" + params.min, { fontFamily: 'Arial', fontSize: params.height, fill: params.color, align: 'center' });
        minText.y = textStart
        minText.x = params.padding
        this.addChild(minText)
        const maxText: PIXI.Text = new PIXI.Text("" + params.max, { fontFamily: 'Arial', fontSize: params.height, fill: params.color, align: 'center' });
        maxText.y = textStart
        maxText.x = params.width + params.padding - maxText.width
        this.addChild(maxText)

        // Put out slider into its starting position
        this.dot.y = params.padding + barStartY
        this.dot.x = this.barStartX + this.getOffset(initial)

        // Add interaction
        this.interactive = true
        this.buttonMode = true

        this.on("pointertap", (event: any) => {
            const point = this.getGlobalPosition()
            const proportion = Math.min(Math.max(event.data.global.x - point.x - this.barStartX, 0), this.params.width) / (params.width)
            const value = params.min + ((params.max - params.min) * proportion)

            // Updates
            this.dot.x = this.barStartX + this.getOffset(value)
            valueText.text = "" + value
            onChange(value)
        })
    }

    private getOffset(value: number): number {
        return (this.params.width) * ((value - this.params.min) / (this.params.max - this.params.min))
    }
}