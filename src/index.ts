import * as PIXI from 'pixi.js';
import { Engine, EngineProps } from './engine';

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
var maxX = window.innerWidth;
var maxY = window.innerHeight;
const app = new PIXI.Application({
    width: window.innerWidth,         // default: 800
    height: window.innerHeight,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
});

app.renderer.backgroundColor = 0x000000;
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

const props: EngineProps = {
    "maxX": maxX,
    "maxY": maxY,
    "minX": 0,
    "minY": 0,
    "count": 30,
}

new Engine(props, app)

window.onresize = (event: any) => {
    props.maxX = event.target.innerWidth
    props.maxY = event.target.innerHeight
    app.renderer.resize(event.target.innerWidth, event.target.innerHeight)
}
