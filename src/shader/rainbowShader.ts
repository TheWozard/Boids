import { formatDiagnostic } from "typescript";
import { Shader } from "../common/interfaces";

export class RainbowShader implements Shader {

    private i: number;
    private pull: number;
    private amount: number;
    private colors: number[];

    constructor(speed: number) {
        this.i = 1
        this.pull = 0
        this.amount = speed
        this.colors = [255, 0, 0]
    }

    public getColor(): number {
        return (this.colors[0] << 16) + (this.colors[1] << 8) + this.colors[2]
    }

    public update(delta: number): void {
        this.colors[this.pull] -= delta * this.amount
        this.colors[this.i] += delta * this.amount
        if (this.colors[this.i] >= 255) {
            this.colors[this.i] = 255
            this.colors[this.pull] = 0
            this.pull = this.i
            this.i++
            if (this.i >= this.colors.length) {
                this.i = 0;
            }
        }
    }
}