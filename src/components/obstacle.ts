import * as PIXI from 'pixi.js';
import Victor from 'victor';
import {Collider} from '../common/interfaces'

export class Obstacle extends PIXI.Graphics implements Collider {

    private radius: number

    constructor(width: number) {
        super();

        this.radius = width/2

        this.lineStyle(0, 0xAAAAAA, 1)
        this.beginFill(0xAAAAAA, 1)
        this.drawCircle(0, 0, this.radius)
        this.endFill()
    }

    public getDistanceToNearestEdge(distance: Victor): number {
        return this.radius
    }

}