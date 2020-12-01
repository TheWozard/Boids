import { Boid } from "./components/boid"
import { Updatable, Wrapable, Shader, SimulationSettings } from "./common/interfaces"
import * as PIXI from 'pixi.js';
import { RainbowShader } from "./shader/rainbowShader";
import { Button } from "./components/button";
import { SolidShader } from "./shader/solidShader";

export interface EngineProps {
    maxX: number, maxY: number,
    minX: number, minY: number,
    count: number,
}

export class Engine {

    private boundedObjects: Wrapable[] = [];
    private updateList: Updatable[] = [];
    private boids: Boid[] = [];

    private settings: SimulationSettings = {
        "debug": false, // Should the Boids render their debug info
        "applyScale": false, // Unimplemented (Scale of boid increases the radiuses proportionally)

        // Direction/Precision is a checked against the dot product of vectors.
        // Range: [-1, 1]
        // 1: only things with the same direction.
        // -1: things in any direction.
        // 0: things in front. 
        // 0.5: things in a 90 arc in front 

        "avoidanceRadius": 50, // Distance a boid will look to not hit something
        "avoidanceFactor": 0.4, // How hard the boid will attempt to avoid hitting something (This is scaled up linearly across the radius)
        "avoidanceDirection": -1, // [-1, 1] Angle the boid will look in for checking avoidance.
        
        "alignRadius": 75, // Distance a boid will look to align with other boids
        "alignFactor": 0.4, // How hard the boid will attempt to align with other boids (This is scaled up linearly across the radius)
        // TODO: is this interesting?
        "alignmentPrecision": 0.7, // [-1, 1] Minimum angle the boid will check alignments in.
        "alignmentDirection": 0, // [-1, 1] Maximum angle the boid will check alignments in.
        
        "centeringRadius": 100, // Distance the boid will look in and find the center of to move towards
        "centeringFactor": 0.04, // How hard the boid will move towards the center. (This is applied at a constant)
        "centeringDirection": -0.5, // [-1, 1] Angle the boid will look in for finding the center
    }
    private running: boolean = true;

    private props: EngineProps;

    constructor(props: EngineProps, app: PIXI.Application) {

        this.props = props
        // const rainbow: Shader = new RainbowShader(1)
        // this.updateList.push(rainbow)

        const plain = new SolidShader(0xFFFFFF)

        for (let index = 0; index < props.count; index++) {
            var boid = new Boid({
                "x": Math.random() * props.maxX,
                "y": Math.random() * props.maxY,
                "shader": plain,
                "speed": 3,
                "settings": this.settings,
            });
            app.stage.addChild(boid)
            this.boundedObjects.push(boid)
            this.updateList.push(boid)
            this.boids.push(boid)
        }

        app.stage.addChild(new Button({
            "x": 5, "y": 5, "text": "Toggle Debug", "color": 0xFFFFFF, "padding": 10, "scale": 10
        }, () => {
             this.settings.debug = !this.settings.debug 
             this.reDraw()
            }))
        app.stage.addChild(new Button({
            "x": 5, "y": 40, "text": "Toggle Pause", "color": 0xFFFFFF, "padding": 10, "scale": 10
        }, () => { this.running = !this.running }))
        app.stage.addChild(new Button({
            "x": 5, "y": 75, "text": "Step", "color": 0xFFFFFF, "padding": 10, "scale": 10
        }, () => { this.forceUpdate(5) }))

        app.ticker.add(this.safeUpdate.bind(this), null, 0)
    }

    public safeUpdate(delta: number) {
        if (this.running) {
            this.forceUpdate(delta)
        }
    }

    public forceUpdate(delta: number) {
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

        this.boids.forEach((current: Boid) => {
            current.checkNeighbors(this.boids, delta);
        })
    }

    public reDraw() {
        this.boids.forEach((boid) => boid.reDraw())
    }

}