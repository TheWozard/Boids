import { Shader } from "../common/interfaces";

export class SolidShader implements Shader {

    private color: number;

    constructor(color: number) {

        this.color = color
    }

    public getColor(): number {
        return this.color
    }

    public update(delta: number): void {
        // NoOp
    }
}