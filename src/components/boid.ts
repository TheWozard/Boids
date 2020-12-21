import * as PIXI from 'pixi.js';
import Victor from 'victor'
import { Updatable, Wrapable, Shader, SimulationSettings, Collider, Context } from '../common/interfaces';

export interface BoidParams {
    x: number,
    y: number,
    shader: Shader,
    settings: SimulationSettings,
    scale?: number,
    speed?: number,

}

export class Boid extends PIXI.Container implements Updatable, Wrapable, Collider {

    // Display
    private boidShader: Shader;
    private boidScale: number;

    // Movement
    private boidSpeedMultiplier: number; // How fast the boid is moving.
    private boidMovementVector: Victor; // Direction the boid is moving. (Normalized)
    private boidAvoidanceVector = new Victor(0, 0) // Direction the boid is trying to avoid. (Normalized)
    private boidAlignmentVector = new Victor(0, 0) // Direction the boid is trying to align with. (Normalized)
    private boidCenteringVector = new Victor(0, 0) // Direction the boid it trying to move to (Normalized)

    // Object that describes simulation settings. This object is updated through mutation.
    private settings: SimulationSettings;

    // Pixi object for the "triangle" graphic
    private boidBody: PIXI.Graphics = new PIXI.Graphics();
    // Pixi  object for all the debug info t
    private boidOverlay: PIXI.Graphics = new PIXI.Graphics();

    // Lets the wrapping code know when it is off the screen
    public readonly wrapPadding: number;

    constructor(params: BoidParams) {
        super();

        this.x = params.x
        this.y = params.y

        this.boidShader = params.shader
        this.boidScale = params.scale != null ? params.scale : 10
        this.boidSpeedMultiplier = params.speed != null ? params.speed : 1

        this.settings = params.settings
        this.wrapPadding = this.boidScale

        this.drawBody()
        // Start in a random direction
        this.boidMovementVector = new Victor((Math.random() * 2) - 1, (Math.random() * 2) - 1).normalize()
        this.boidBody.rotation = this.boidMovementVector.direction()

        // Drawing the pointer
        this.addChild(this.boidBody)
        this.addChild(this.boidOverlay)
    }

    // Collider: Allows other objects to know how close they are to this things edge
    public getDistanceToNearestEdge(distance: Victor): number {
        return this.boidScale
    }

    // Updatable: Updates the movement of the boid
    public update(delta: number, context: Context): void {

        if (delta > 0) {
            // TODO: Configurable AI?
            this.boidMovementVector = this.checkNeighbors(delta, context)
            this.boidBody.rotation = this.boidMovementVector.direction()
                
            const movement = this.boidMovementVector.clone()
                .multiplyScalar(this.boidSpeedMultiplier * delta)

            this.x = this.x + movement.x
            this.y = this.y + movement.y
        }

        if (this.settings.debug) {
            this.drawOverlay()
        } else {
            this.boidOverlay.clear()
        }
    }

    private checkNeighbors(delta: number, context: Context): Victor {
        const avoidanceVector = new Victor(0, 0)
        for (let index = 0; index < context.colliders.length; index++) {
            const target: Collider = context.colliders[index]
            const distance: Victor = new Victor(target.x - this.x, target.y - this.y)
            const magnitude: number = distance.magnitude()
            const distanceTo: number = target.getDistanceToNearestEdge(distance)
            if (magnitude - distanceTo < this.boidScale) {
                avoidanceVector.add(distance.divideScalar(magnitude / (this.settings.avoidanceRadius + distanceTo)))
            }
        }
        if (!avoidanceVector.isZero()) {
            return avoidanceVector.invert().normalize()
        }
        const alignmentVector = new Victor(0, 0)
        const centeringVector = new Victor(0, 0)
        const maxDistance = Math.max(Math.max(this.settings.alignRadius, this.settings.avoidanceRadius), this.settings.centeringRadius)
        for (let index = 0; index < context.entities.length; index++) {
            const target: Boid = context.entities[index];
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
        const output = this.boidMovementVector.clone().multiplyScalar(5)
        if (!avoidanceVector.isZero()) {
            // We summed up all the vectors pointing towards now we need to invert it
            // to point away.
            this.boidAvoidanceVector = avoidanceVector.invert().normalize()
            output.add(this.boidAvoidanceVector.clone().multiplyScalar(this.settings.avoidanceFactor))
        } else {
            this.boidAvoidanceVector = avoidanceVector
        }
        if (!alignmentVector.isZero()) {
            this.boidAlignmentVector = alignmentVector.normalize()
            output.add(this.boidAlignmentVector.clone().multiplyScalar(this.settings.alignFactor))
        } else {
            this.boidAlignmentVector = alignmentVector
        }
        if (!centeringVector.isZero()) {
            this.boidCenteringVector = centeringVector.normalize()
            output.add(this.boidCenteringVector.clone().multiplyScalar(this.settings.centeringFactor))
        } else {
            this.boidCenteringVector = centeringVector
        }
        if (context.bait) {
            const lureVector = new Victor(context.bait.x, context.bait.y).subtract(new Victor(this.x, this.y)).normalize()
            output.add(lureVector.multiplyScalar(this.settings.baitFactor))
        }
        return output.normalize()
    }

    private drawBody(): void {
        // Draws the "triangle" shape. 
        // Unless the shape is changing color or size this should never need to be called again
        const color = this.boidShader.getColor()
        this.boidBody.clear()
        this.boidBody.beginFill(color, 1);
        this.boidBody.lineStyle(0, color, 1);
        this.boidBody.moveTo(-1 * this.boidScale, this.boidScale);
        this.boidBody.lineTo(this.boidScale, 0);
        this.boidBody.lineTo(-1 * this.boidScale, -1 * this.boidScale);
        this.boidBody.lineTo(-0.5 * this.boidScale, 0);
        this.boidBody.lineTo(-1 * this.boidScale, this.boidScale);
        this.boidBody.endFill();
    }

    private drawOverlay() {
        this.boidOverlay.clear()
        const trueScale = this.boidScale * 2

        // Alignment
        Boid.drawVectorAndArc(this.boidOverlay, 0xFFC000, this.boidAlignmentVector,
            this.settings.alignRadius, this.settings.alignmentDirection,
            0.2, trueScale, this.boidBody.rotation)

        // Avoidance
        Boid.drawVectorAndArc(this.boidOverlay, 0x00FFFF, this.boidAvoidanceVector,
            this.settings.avoidanceRadius, this.settings.avoidanceDirection,
            0.2, trueScale, this.boidBody.rotation)

        // Centering
        Boid.drawVectorAndArc(this.boidOverlay, 0xFF0000, this.boidCenteringVector,
            this.settings.centeringRadius, this.settings.centeringDirection,
            0.2, trueScale, this.boidBody.rotation)

        // Movement
        Boid.drawVector(this.boidOverlay, 0x00FF00, this.boidMovementVector, trueScale)
    }

    // These could be moved to a more general package whenever they are needed in the future

    private static drawVectorAndArc(graphic: PIXI.Graphics, color: number, vector: Victor, radius: number, direction: number, factor: number, scale: number, rotation: number) {
        this.drawArc(graphic, color, radius, direction, factor, rotation)
        this.drawVector(graphic, color, vector, scale)
    }

    private static drawArc(graphic: PIXI.Graphics, color: number, radius: number, direction: number, factor: number, rotation: number) {
        const halfArch = ((1 - direction) * Math.PI) / 2
        graphic.lineStyle(1, color, factor);
        graphic.moveTo(0, 0);
        graphic.arc(0, 0, radius, rotation - halfArch, rotation + halfArch)
        graphic.lineTo(0, 0)
    }

    private static drawVector(graphic: PIXI.Graphics, color: number, vector: Victor, scale: number) {
        graphic.lineStyle(3, color, 1);
        graphic.moveTo(0, 0);
        graphic.lineTo(vector.x * scale, vector.y * scale)
    }

}