export class RainbowShader {
    constructor(speed) {
        this.i = 0
        this.pull = 2
        this.amount = speed
        this.colors = [255, 0, 0]
    }

    getColor() {
        return (this.colors[0] << 16) + (this.colors[1] << 8) + this.colors[2]
    }

    nextColor(delta) {
        if (this.colors[this.i] >= 256) {
            this.pull = this.i
            this.i ++
            if (this.i >= this.colors.length) {
                this.i = 0;
            }
        }
        this.colors[this.pull] -= delta * this.amount
        this.colors[this.i] += delta * this.amount
    }
}