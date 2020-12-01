export interface Updatable {
    update(delta: number): void
}

export interface Wrapable {
    x: number
    y: number
    readonly wrapPadding: number;
}

export interface Shader extends Updatable {
    getColor(): number
}