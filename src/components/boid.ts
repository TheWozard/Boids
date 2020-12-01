import * as PIXI from 'pixi.js';
import Victor from 'victor'
import { Updatable, Wrapable, Shader } from '../common/interfaces';
import { SolidShader } from '../shader/solidShader';

export interface BoidParams {
    x: number,
    y: number,
    scale?: number,
    shader?: Shader,
    speed?: number,
    drawVector?: boolean,
}

export class Boid extends PIXI.Container implements Updatable, Wrapable {

    private boidShader: Shader;
    private boidScale: number;

    private boidSpeedMultiplier: number;
    private boidMovementVector: Victor;

    private drawVector: boolean;

    private boidBody: PIXI.Graphics = new PIXI.Graphics();
    private boidOverlay: PIXI.Graphics = new PIXI.Graphics();

    public readonly wrapPadding: number;

    constructor(params: BoidParams) {
        super();

        this.x = params.x
        this.y = params.y

        this.boidShader = params.shader || new SolidShader(0xFF0000)
        this.boidScale = params.scale != null ? params.scale : 10
        this.boidSpeedMultiplier = params.speed != null ? params.speed : 1

        this.wrapPadding = this.boidScale

        this.drawVector = params.drawVector || false

        // this.boidMovementVector = new Victor((Math.random() * 2)-1, (Math.random() * 2)-1).normalize()
        this.boidMovementVector = new Victor(0.5, 0.5).normalize()

        // Drawing the pointer
        this.addChild(this.boidBody)
        this.addChild(this.boidOverlay)

        this.drawBody(this.boidScale, this.boidScale, this.boidShader.getColor())
        this.pointVector(this.boidMovementVector)

        window.addEventListener("mousemove", e => this.pointAt(e.clientX, e.clientY), false);
    }

    public pointVector(vector: Victor): void {
        this.boidBody.rotation = vector.direction()
    }

    public update(delta: number): void {
        const movement: Victor = this.boidMovementVector.clone()
            .multiplyScalar(this.boidSpeedMultiplier * delta)

        this.x = this.x + movement.x
        this.y = this.y + movement.y

        this.drawBody(this.boidScale, this.boidScale, this.boidShader.getColor())
    }

    private pointAt(x: number, y: number) {
        this.boidMovementVector = new Victor(x, y).subtract(new Victor(this.x, this.y)).normalize()
        this.pointVector(this.boidMovementVector)
    }

    private drawBody(w: number, h: number, color: number): void {
        this.boidBody.clear()
        this.boidBody.beginFill(color, 1);
        this.boidBody.lineStyle(0, color, 1);
        this.boidBody.moveTo(-1 * w, h);
        this.boidBody.lineTo(w, 0);
        this.boidBody.lineTo(-1 * w, -1 * h);
        this.boidBody.lineTo(-0.5 * w, 0);
        this.boidBody.lineTo(-1 * w, h);
        this.boidBody.endFill();

        if (this.drawVector) {
            this.boidOverlay.clear()
            this.boidOverlay.lineStyle(1, 0x00FF00, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidMovementVector.x * this.boidScale * 2, this.boidMovementVector.y * this.boidScale * 2)
            const objs: PIXI.DisplayObject[] = this.boidOverlay.removeChildren()
            objs.forEach((obj: PIXI.DisplayObject) => obj.destroy())
            const text: PIXI.Text = new PIXI.Text(this.boidMovementVector.toString(), { fontFamily: 'Arial', fontSize: this.boidScale, fill: 0x00FF00, align: 'center' })
            text.x = w
            text.y = -2 * h
            this.boidOverlay.addChild(text)
        }
    }
}