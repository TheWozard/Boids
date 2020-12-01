import * as PIXI from 'pixi.js';
import Victor from 'victor'
import { Updatable, Wrapable, Shader, SimulationSettings } from '../common/interfaces';
import { SolidShader } from '../shader/solidShader';

export interface BoidParams {
    x: number,
    y: number,
    scale?: number,
    shader?: Shader,
    speed?: number,
    
    settings: SimulationSettings,
}

export class Boid extends PIXI.Container implements Updatable, Wrapable {

    private boidShader: Shader;
    private boidScale: number;

    private boidSpeedMultiplier: number;
    private boidMovementVector: Victor;
    private boidIntendedLocationVector: Victor;

    private settings: SimulationSettings;
    private muted: boolean = false;

    private static MutedShader: Shader = new SolidShader(0xAAAAAA)

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
        this.boidIntendedLocationVector = this.boidMovementVector

        // Drawing the pointer
        this.addChild(this.boidBody)
        this.addChild(this.boidOverlay)

        this.drawBody(this.boidScale, this.boidScale, this.getColor())
        this.pointVector(this.boidMovementVector)

        this.interactive = true
        this.buttonMode = true

        this.on("pointertap", (event: any) => {
            this.muted = !this.muted
            this.drawBody(this.boidScale, this.boidScale, this.getColor())
        })

        // window.addEventListener("mousemove", e => this.pointAt(e.clientX, e.clientY), false);
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

    public checkNeighbors(boids: Boid[], delta: number) {
        if (!this.muted) {
            var sumX: number = 0
            var sumY: number = 0
            var counted: number = 0
            for (let index = 0; index < boids.length; index++) {
                const target: Boid = boids[index];
                if (target === this) {
                    continue
                }
                const distanceVector: Victor = new Victor(target.x, target.y).subtract(new Victor(this.x, this.y))
                const magnitude = distanceVector.magnitude()
                const dot = distanceVector.normalize().dot(this.boidMovementVector)
                if (magnitude < this.settings.alignRadius && dot > this.settings.alignmentDirection && dot < this.settings.alignmentPrecision) {
                    const effectMagnitude: number = ((this.settings.alignRadius - magnitude) / this.settings.alignRadius) * this.settings.alignFactor * delta
                    this.boidMovementVector = this.boidMovementVector.add(target.boidMovementVector.clone().multiplyScalar(effectMagnitude)).normalize()
                }
                if (magnitude < this.settings.avoidanceRadius && dot > this.settings.avoidanceDirection) {
                    const effectMagnitude: number = ((this.settings.avoidanceRadius - magnitude) / this.settings.avoidanceRadius) * this.settings.avoidanceFactor * delta
                    this.boidMovementVector = this.boidMovementVector.subtract(distanceVector.normalize().multiplyScalar(effectMagnitude)).normalize()
                }
                if (magnitude < this.settings.centeringRadius && dot > this.settings.centeringDirection) {
                    counted ++
                    sumX += target.x - this.x
                    sumY += target.y - this.y
                }
                this.pointVector(this.boidMovementVector)
            }
            if (counted === 0) {
                this.boidIntendedLocationVector = this.boidMovementVector
            } else {
                const targetX: number = sumX / counted
                const targetY: number = sumY / counted
                this.boidIntendedLocationVector = new Victor(targetX, targetY).normalize()
                this.boidMovementVector = this.boidMovementVector.add(this.boidIntendedLocationVector.clone().multiplyScalar(this.settings.centeringFactor * delta)).normalize()
            }
        }
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
            
            this.boidOverlay.moveTo(0,0)
            
            var halfArch: number;
            const halfArchStart = ((1 - this.settings.alignmentDirection )* Math.PI)/ 2
            const halfArchEnd = ((1 - this.settings.alignmentPrecision )* Math.PI)/ 2
            this.boidOverlay.lineStyle(1, 0xFFC000,0.2);
            this.boidOverlay.arc(0,0,this.settings.alignRadius, this.boidBody.rotation - halfArchStart, this.boidBody.rotation - halfArchEnd)
            this.boidOverlay.lineTo(0,0)
            this.boidOverlay.lineStyle(1, 0xFFC000,0.2);
            this.boidOverlay.arc(0,0,this.settings.alignRadius, this.boidBody.rotation + halfArchEnd, this.boidBody.rotation + halfArchStart)
            this.boidOverlay.lineTo(0,0)
            halfArch = ((1 - this.settings.avoidanceDirection )* Math.PI)/ 2
            this.boidOverlay.lineStyle(1, 0xFFFC00,0.2);
            this.boidOverlay.arc(0,0,this.settings.avoidanceRadius, this.boidBody.rotation - halfArch, this.boidBody.rotation + halfArch)
            this.boidOverlay.lineTo(0,0)
            halfArch = ((1 - this.settings.centeringDirection )* Math.PI)/ 2
            this.boidOverlay.lineStyle(1, 0x00FFFF,0.2);
            this.boidOverlay.arc(0,0,this.settings.centeringRadius, this.boidBody.rotation - halfArch, this.boidBody.rotation + halfArch)
            this.boidOverlay.lineTo(0,0)
            
            this.boidOverlay.lineStyle(3, 0x00FF00, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidMovementVector.x * this.boidScale * 2, this.boidMovementVector.y * this.boidScale * 2)
            this.boidOverlay.lineStyle(3, 0x0000FF, 1);
            this.boidOverlay.moveTo(0, 0);
            this.boidOverlay.lineTo(this.boidIntendedLocationVector.x * this.boidScale * 2, this.boidIntendedLocationVector.y * this.boidScale * 2)
        }
    }

    private getColor(): number {
        if (this.muted) {
            return Boid.MutedShader.getColor();
        }
        return this.boidShader.getColor();
    }
}