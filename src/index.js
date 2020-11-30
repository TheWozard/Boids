import * as PIXI from 'pixi.js';
import { Line } from './components/line'
import { Boid } from './components/boid'

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: 256,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
});

app.renderer.backgroundColor = 0x000000;
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
var maxX = window.innerWidth;
var maxY = window.innerHeight;
app.renderer.resize(maxX, maxY);

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

for (let index = 0; index < 20; index++) {
    var boid = new Boid(Math.random()*maxX, Math.random()*maxY, maxX, maxY);
    app.stage.addChild(boid)
    app.ticker.add(boid.update.bind(boid),null,0)
}

// window.addEventListener("mousemove", e => line.updatePoints([null, null, e.clientX, e.clientY]), false);
