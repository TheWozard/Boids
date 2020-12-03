import * as PIXI from 'pixi.js';
import Victor from 'victor'
import { Updatable, Wrapable, Shader, SimulationSettings, Collider } from '../common/interfaces';
import { SolidShader } from '../shader/solidShader';
import { Obstacle } from './obstacle';

export interface BoidParams {
    x: number,
    y: number,
    scale?: number,
    shader?: Shader,
    speed?: number,

    settings: SimulationSettings,
}

export class Boid extends PIXI.Container implements Updatable, Wrapable, Collider {

    private boidShader: Shader;
    private boidScale: number;

    private boidSpeedMultiplier: number;
    private boidMovementVector: Victor;
    private boidAvoidanceVector = new Victor(0, 0)
    private boidAlignmentVector = new Victor(0, 0)
    private boidCenteringVector = new Victor(0, 0)

    private settings: SimulationSettings;

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

        this.settings = params.settings
        this.wrapPadding = this.boidScale

        this.boidMovementVector = new Victor((Math.random() * 2) - 1, (Math.random() * 2) - 1).normalize()

        // Drawing the pointer
        this.addChild(this.boidBody)
        this.addChild(this.boidOverlay)

        this.drawBody(this.boidScale, this.boidScale, this.boidShader.getColor())
        this.pointVector(this.boidMovementVector)

        this.interactive = true
        this.buttonMode = true
    }

    public getDistanceToNearestEdge(distance: Victor): number {
        return this.boidScale
    }

    public pointVector(vector: Victor): void {
        this.boidBody.rotation = vector.direction()
    }

    public update(delta: number): void {
        const movement: Victor = this.boidMovementVector.clone()
            .multiplyScalar(this.boidSpeedMultiplier * delta)

        this.x = this.x + movement.x
        this.y = this.y + movement.y

        if (this.settings.debug) {
            this.reDraw()
        }
    }

    public checkNeighbors(boids: Boid[], colliders: Collider[], delta: number) {
        const avoidanceVector = new Victor(0, 0)
        // Protection from having the avoidance smaller then the objects scale
        const trueAvoidanceDistance: number = Math.max(this.boidScale, this.settings.avoidanceRadius)
        for (let index = 0; index < colliders.length; index++) {
            const target: Collider = colliders[index]
            const distance: Victor = new Victor(target.x - this.x, target.y - this.y)
            const magnitude: number = distance.magnitude()
            const distanceTo: number =  target.getDistanceToNearestEdge(distance)
            if (magnitude - distanceTo < trueAvoidanceDistance + distanceTo){
                avoidanceVector.add(distance.divideScalar(magnitude/(this.settings.avoidanceRadius + distanceTo)))
            }
        }
        if (!avoidanceVector.isZero()) {
            this.boidAvoidanceVector = avoidanceVector.invert().normalize()
            this.boidMovementVector.add(this.boidAvoidanceVector.clone())
        } else {
            const alignmentVector = new Victor(0, 0)
            const centeringVector = new Victor(0, 0)
            const maxDistance = Math.max(Math.max(this.settings.alignRadius, this.settings.avoidanceRadius), this.settings.centeringRadius)
            for (let index = 0; index < boids.length; index++) {
                const target: Boid = boids[index];
                if (target === this) {
                    continue // We can skip ourself.
                }
                const distanceVector: Victor = new Victor(target.x, target.y).subtract(new Victor(this.x, this.y))
                const distance = distanceVector.magnitude()
                if (distance < maxDistance) {
                    const dot = distanceVector.normalize().dot(this.boidMovementVector)
                    if (distance < this.settings.alignRadius && dot > this.settings.alignmentDirection) {
                        alignmentVector.add(target.boidMovementVector.clone().divideScalar(distance / this.settings.alignRadius))
                    }
                    if (distance < this.settings.avoidanceRadius && dot > this.settings.avoidanceDirection) {
                        avoidanceVector.add(distanceVector.divideScalar(distance / this.settings.avoidanceRadius))
                    }
                    if (distance < this.settings.centeringRadius && dot > this.settings.centeringDirection) {
                        centeringVector.add(distanceVector.divideScalar(distance / this.settings.centeringRadius))
                    }
                }
            }
            this.boidMovementVector.multiplyScalar(5)
            if (!avoidanceVector.isZero()) {
                // We summed up all the vectors pointing towards now we need to invert it
                // to point away.
                this.boidAvoidanceVector = avoidanceVector.invert().normalize()
                this.boidMovementVector.add(this.boidAvoidanceVector.clone().multiplyScalar(this.settings.avoidanceFactor))
            } else {
                this.boidAvoidanceVector = avoidanceVector
            }
            if (!alignmentVector.isZero()) {
                this.boidAlignmentVector = alignmentVector.normalize()
                this.boidMovementVector.add(this.boidAlignmentVector.clone().multiplyScalar(this.settings.alignFactor))
            } else {
                this.boidAlignmentVector = alignmentVector
            }
            if (!centeringVector.isZero()) {
                this.boidCenteringVector = centeringVector.normalize()
                this.boidMovementVector.add(this.boidCenteringVector.clone().multiplyScalar(this.settings.centeringFactor))
            } else {
                this.boidCenteringVector = centeringVector
            }
        }
        this.boidMovementVector.normalize()
        this.pointVector(this.boidMovementVector)
    }

    public reDraw() {
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

        this.boidOverlay.clear()
        if (this.settings.debug) {

            this.boidOverlay.moveTo(0, 0)

            var halfArch: number;

            // Alignment Info
            halfArch = ((1 - this.settings.alignmentDirection) * Math.PI) / 2
            this.boidOverlay.lineStyle(1, 0xFFC000, 0.2);
            this.boidOverlay.arc(0, 0, this.settings.alignRadius, this.boidBody.rotation - halfArch, this.boidBody.rotation + halfArch)
            this.boidOverlay.lineTo(0, 0)
            this.boidOverlay.lineStyle(3, 0xFFC000, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidAlignmentVector.x * this.boidScale * 2, this.boidAlignmentVector.y * this.boidScale * 2)
            this.boidOverlay.moveTo(0, 0)

            // Avoidance Info
            halfArch = ((1 - this.settings.avoidanceDirection) * Math.PI) / 2
            this.boidOverlay.lineStyle(1, 0xFF0000, 0.2);
            this.boidOverlay.arc(0, 0, this.settings.avoidanceRadius, this.boidBody.rotation - halfArch, this.boidBody.rotation + halfArch)
            this.boidOverlay.lineTo(0, 0)
            this.boidOverlay.lineStyle(3, 0xFF0000, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidAvoidanceVector.x * this.boidScale * 2, this.boidAvoidanceVector.y * this.boidScale * 2)
            this.boidOverlay.moveTo(0, 0)

            // Centering Info
            halfArch = ((1 - this.settings.centeringDirection) * Math.PI) / 2
            this.boidOverlay.lineStyle(1, 0x00FFFF, 0.2);
            this.boidOverlay.arc(0, 0, this.settings.centeringRadius, this.boidBody.rotation - halfArch, this.boidBody.rotation + halfArch)
            this.boidOverlay.lineTo(0, 0)
            this.boidOverlay.lineStyle(3, 0x00FFFF, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidCenteringVector.x * this.boidScale * 2, this.boidCenteringVector.y * this.boidScale * 2)
            this.boidOverlay.moveTo(0, 0)

            // Movement Vector Info
            this.boidOverlay.lineStyle(3, 0x00FF00, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidMovementVector.x * this.boidScale * 2, this.boidMovementVector.y * this.boidScale * 2)

        }
    }
}