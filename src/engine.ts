import {Boid} from "./components/boid"
import {Updatable, Wrapable, Shader} from "./common/interfaces"
import * as PIXI from 'pixi.js';
import { RainbowShader } from "./shader/rainbowShader";

export interface EngineProps{
    maxX: number, maxY: number,
    minX: number, minY: number,
    count: number,
}

export class Engine implements Updatable {

    private boundedObjects: Wrapable[] = [];
    private updateList: Updatable[] = [];

    private props: EngineProps;

    constructor(props: EngineProps, app: PIXI.Application) {

        this.props = props
        const rainbow: Shader = new RainbowShader(1)
        this.updateList.push(rainbow)

        for (let index = 0; index < props.count; index++) {
            var boid = new Boid({
                "x": Math.random() * props.maxX,
                "y": Math.random() * props.maxY,
                "drawVector": false,
                "shader": rainbow,
            });
            app.stage.addChild(boid)
            this.boundedObjects.push(boid)
            this.updateList.push(boid)
        }
        app.ticker.add(this.update.bind(this), null, 0)
    }

    public update(delta: number) {
        this.updateList.forEach((itm: Updatable) => itm.update(delta))

        this.boundedObjects.forEach((obj) => {
            // TODO: This better
            if (obj.x < this.props.minX - obj.wrapPadding) {
                obj.x = this.props.maxX + obj.wrapPadding
            } else if (obj.x > this.props.maxX + obj.wrapPadding) {
                obj.x = this.props.minX - obj.wrapPadding
            }

            if (obj.y < this.props.minY - obj.wrapPadding) {
                obj.y = this.props.maxY + obj.wrapPadding
            } else if (obj.y > this.props.maxY + obj.wrapPadding) {
                obj.y = this.props.minY - obj.wrapPadding
            }
        })
    }

}