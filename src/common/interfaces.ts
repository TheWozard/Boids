import * as PIXI from 'pixi.js';
import Victor from "victor";
import { Boid } from "../components/boid";

export interface Updatable {
    update(delta: number, context: Context): void
}

export interface Wrapable {
    x: number
    y: number
    readonly wrapPadding: number;
}

export interface Collider {
    x: number,
    y: number,
    getDistanceToNearestEdge(distance: Victor): number
}

export interface Shader extends Updatable {
    getColor(): number
}

export interface SimulationSettings {
    debug: boolean;
    applyScale: boolean;

    avoidanceRadius: number;
    avoidanceFactor: number;
    avoidanceDirection: number;
    
    alignRadius: number;
    alignFactor: number;
    alignmentDirection: number;

    centeringRadius: number;
    centeringFactor: number;
    centeringDirection: number;

    baitFactor: number;
}

export interface Context {
    entities: Boid[]; 
    colliders: Collider[]
    bait: PIXI.Point | null
}