import * as PIXI from 'pixi.js';

export class Menu extends PIXI.Container {

    constructor(items: PIXI.Container[], padding: number) {
        super()

        var prevY: number = 0

        items.forEach((item) => {
            item.y = prevY
            prevY += item.height + padding
            this.addChild(item)
        })
    }
}