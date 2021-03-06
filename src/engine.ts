import { Boid } from "./components/boid"
import { Updatable, Wrapable, Shader, SimulationSettings, Context } from "./common/interfaces"
import * as PIXI from 'pixi.js';
import { Button } from "./components/button";
import { SolidShader } from "./shader/solidShader";
import { Slider } from "./components/slider";
import { Menu } from "./components/menu";
import { Divider } from "./components/divider";
import { Obstacle } from "./components/obstacle";
import Victor from "victor";

export interface EngineProps {
    maxX: number, maxY: number,
    minX: number, minY: number,
}

export class Engine {

    // private updateList: Updatable[] = [];
    private obstacles: Obstacle[] = [];
    private boids: Boid[] = [];

    private boidColors = [
        new SolidShader(0x5FB9D5),
        new SolidShader(0x7AC6DC),
        new SolidShader(0x8ACDE0),
        new SolidShader(0xA2D9E7),
        new SolidShader(0xB3E2EB),
        new SolidShader(0xDDE8E9),
    ]
    private boidCount = 250
    private obstacleCount = 20
    private static defaultSettings: SimulationSettings = {
        "debug": false, // Should the Boids render their debug info
        "applyScale": false, // Unimplemented (Scale of boid increases the radiuses proportionally)

        // Direction/Precision is a checked against the dot product of vectors.
        // Range: [-1, 1]
        // 1: only things with the same direction.
        // -1: things in any direction.
        // 0: things in front. 
        // 0.5: things in a 90 arc in front 

        "avoidanceRadius": 25, // Distance a boid will look to not hit something
        "avoidanceFactor": 0.4, // How hard the boid will attempt to avoid hitting something (This is scaled up linearly across the radius)
        "avoidanceDirection": -1, // [-1, 1] Angle the boid will look in for checking avoidance.

        "alignRadius": 75, // Distance a boid will look to align with other boids
        "alignFactor": 0.7, // How hard the boid will attempt to align with other boids (This is scaled up linearly across the radius)
        "alignmentDirection": 0, // [-1, 1] Angle the boid will check alignments in.

        "centeringRadius": 100, // Distance the boid will look in and find the center of to move towards
        "centeringFactor": 0.04, // How hard the boid will move towards the center. (This is applied at a constant)
        "centeringDirection": -0.5, // [-1, 1] Angle the boid will look in for finding the center

        // "speedMultiplier": 1,

        "baitFactor": 0.5,

    }
    private settings: SimulationSettings;
    private running: boolean = true;

    private props: EngineProps;
    private tickText: PIXI.Text;
    private locationText: PIXI.Text;

    private sumUpdateTime: number = 0;
    private updateCount: number = 0;

    private baitLocation: PIXI.Point | null = null;

    constructor(props: EngineProps, app: PIXI.Application) {

        this.props = props
        this.settings = Object.assign({}, Engine.defaultSettings)

        for (let index = 0; index < this.obstacleCount; index++) {
            const obstacle = new Obstacle(Math.floor((Math.random() * 20) + 50))
            obstacle.x = Math.random() * props.maxX
            obstacle.y = Math.random() * props.maxY
            app.stage.addChild(obstacle)
            this.obstacles.push(obstacle)
        }

        for (let index = 0; index < this.boidCount; index++) {
            var boid = new Boid({
                "x": Math.random() * props.maxX,
                "y": Math.random() * props.maxY,
                "shader": this.boidColors[Math.floor(Math.random() * this.boidColors.length)],
                "speed": 3,
                "scale": (Math.random() * 5) + 5,
                "settings": this.settings,
            });
            app.stage.addChild(boid)
            this.boids.push(boid)
        }

        const width = 200
        const padding = 5
        const color = 0xFFFFFF
        const divider = 20

        const menu = new Menu([
            new Slider({
                "title": "Avoidance Radius", "height": 10, "width": width, "min": 0, "max": 100, "padding": padding, "color": color, "round":1,
            }, (value: number) => { this.settings.avoidanceRadius = value; this.update(0); }, this.settings.avoidanceRadius),
            new Slider({
                "title": "Avoidance Factor", "height": 10, "width": width, "min": 0, "max": 1, "padding": padding, "color": color, "round":0.01,
            }, (value: number) => { this.settings.avoidanceFactor = value; this.update(0); }, this.settings.avoidanceFactor),
            new Slider({
                "title": "Avoidance Direction", "height": 10, "width": width, "min": -1, "max": 1, "padding": padding, "color": color, "round":0.1,
            }, (value: number) => { this.settings.avoidanceDirection = value; this.update(0); }, this.settings.avoidanceDirection),
            new Divider({
                "height": divider, "width": width + 2 * padding, "color": color,
            }),
            new Slider({
                "title": "Align Radius", "height": 10, "width": width, "min": 0, "max": 100, "padding": padding, "color": color, "round":1,
            }, (value: number) => { this.settings.alignRadius = value; this.update(0); }, this.settings.alignRadius),
            new Slider({
                "title": "Align Factor", "height": 10, "width": width, "min": 0, "max": 1, "padding": padding, "color": color, "round":0.01,
            }, (value: number) => { this.settings.alignFactor = value; this.update(0); }, this.settings.alignFactor),
            new Slider({
                "title": "Align Direction", "height": 10, "width": width, "min": -1, "max": 1, "padding": padding, "color": color, "round":0.1,
            }, (value: number) => { this.settings.alignmentDirection = value; this.update(0); }, this.settings.alignmentDirection),
            new Divider({
                "height": divider, "width": width + 2 * padding, "color": color,
            }),
            new Slider({
                "title": "Centering Radius", "height": 10, "width": width, "min": 0, "max": 100, "padding": padding, "color": color, "round":1,
            }, (value: number) => { this.settings.centeringRadius = value; this.update(0); }, this.settings.centeringRadius),
            new Slider({
                "title": "Centering Factor", "height": 10, "width": width, "min": 0, "max": 0.5, "padding": padding, "color": color, "round":0.01,
            }, (value: number) => { this.settings.centeringFactor = value; this.update(0); }, this.settings.centeringFactor),
            new Slider({
                "title": "Centering Direction", "height": 10, "width": width, "min": -1, "max": 1, "padding": padding, "color": color, "round":0.1,
            }, (value: number) => { this.settings.centeringDirection = value; this.update(0); }, this.settings.centeringDirection),
            new Divider({
                "height": divider, "width": width + 2 * padding, "color": color,
            }),
            new Slider({
                "title": "Boids", "height": 10, "width": width, "min": 0, "max": 500, "padding": padding, "color": color, "round":1,
            }, (value: number) => {
                while (value > this.boids.length) {
                    var boid = new Boid({
                        "x": Math.random() * props.maxX,
                        "y": Math.random() * props.maxY,
                        "shader": this.boidColors[Math.floor(Math.random() * this.boidColors.length)],
                        "speed": 5,
                        "scale": 7,
                        "settings": this.settings,
                    });
                    app.stage.addChild(boid)
                    this.boids.push(boid)
                }
                while (value < this.boids.length) {
                    const boid = this.boids.pop()
                    if (boid == null) {
                        break;
                    }
                    app.stage.removeChild(boid)
                }
            }, this.boidCount),

        ], padding)
        menu.x = padding
        menu.y = padding
        app.stage.addChild(menu)

        const buttonMenu = new Menu([
            new Button({
                "x": 5, "y": 5, "text": "Toggle Debug", "color": 0xFFFFFF, "padding": padding, "scale": 10
            }, () => {
                this.settings.debug = !this.settings.debug
                this.update(0)
            }),
            new Button({
                "x": 5, "y": 40, "text": "Toggle Pause", "color": 0xFFFFFF, "padding": padding, "scale": 10
            }, () => { this.running = !this.running }),
            new Button({
                "x": 5, "y": 75, "text": "Step", "color": 0xFFFFFF, "padding": padding, "scale": 10
            }, () => { this.update(5) }),
            // new Button({
            //     "x": 5, "y": 5, "text": "Reset Settings", "color": 0xFFFFFF, "padding": padding, "scale": 10
            // }, () => {
            //     this.settings = Object.assign(this.settings, Engine.defaultSettings)
            // })
        ], 5)
        buttonMenu.x = width + (4 * padding)
        buttonMenu.y = padding
        app.stage.addChild(buttonMenu)

        const toggleMenus = new Button({
            "x": 5, "y": 5, "text": "Toggle Menus", "color": 0xFFFFFF, "padding": padding, "scale": 10
        }, () => {
            menu.visible = !menu.visible
            buttonMenu.visible = menu.visible
        })
        toggleMenus.x = 5
        toggleMenus.y = props.maxY - 5 - toggleMenus.height
        app.stage.addChild(toggleMenus)

        menu.visible = false
        buttonMenu.visible = false

        this.tickText = new PIXI.Text("" + 0, { fontFamily: 'Arial', fontSize: 20, fill: color, align: 'start' })
        this.tickText.x = toggleMenus.x + toggleMenus.width + 5
        this.tickText.y = props.maxY - 5 - this.tickText.height
        app.stage.addChild(this.tickText)

        this.locationText = new PIXI.Text("", { fontFamily: 'Arial', fontSize: 20, fill: color, align: 'start' })
        this.locationText.x = (props.maxX/2) - (this.locationText.width/2)
        this.locationText.y = props.maxY - 5 - this.locationText.height
        app.stage.addChild(this.locationText)

        app.ticker.add(this.safeUpdate.bind(this), null, 0)

        app.stage
            // events for drag start
            .on('mousedown', this.onDragStart.bind(this))
            .on('touchstart', this.onDragStart.bind(this))
            // events for drag end
            .on('mouseup', this.onDragEnd.bind(this))
            .on('mouseupoutside', this.onDragEnd.bind(this))
            .on('touchend', this.onDragEnd.bind(this))
            .on('touchendoutside', this.onDragEnd.bind(this))
            // events for drag move
            .on('mousemove', this.onDragMove.bind(this))
            .on('touchmove', this.onDragMove.bind(this));
    }

    public safeUpdate(delta: number) {
        if (this.running) {
            this.update(delta)
        }
    }

    public update(delta: number) {
        this.sumUpdateTime += delta
        this.updateCount++
        if (this.updateCount >= 20) {
            this.tickText.text = "" + Math.floor((this.sumUpdateTime / this.updateCount) * 100) / 100
            this.sumUpdateTime = 0
            this.updateCount = 0
        }
        const context: Context = {
            "colliders": this.obstacles,
            "entities": this.boids,
            "bait": this.baitLocation,
        }

        this.boids.forEach((obj) => {
            obj.update(delta, context)
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

        if (this.baitLocation == null && this.locationText.text != "")  {
            this.locationText.text = ""
        }
        if (this.baitLocation != null) {
            this.locationText.text = "X:" + this.baitLocation.x + ", Y:" + this.baitLocation.y
            this.locationText.x = (this.props.maxX/2) - (this.locationText.width/2)
        }
    }

    public onDragStart(event: any) {
        this.baitLocation = event.data.global
    }

    public onDragEnd(event: any) {
        this.baitLocation = null
    }
 
    public onDragMove(event: any) {
        if (this.baitLocation != null) {
            this.baitLocation = event.data.global
        }
    }

}