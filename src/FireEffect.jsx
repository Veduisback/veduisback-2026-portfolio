import React, { useEffect, useRef } from "react";

import * as PIXI from "pixi.js";

import {
TweenMax,
TimelineMax,
Power0,
Power1,
Power2,
Bounce,
} from "gsap";

import * as PIXIFilters from "pixi-filters";

const filters =
PIXI.filters || {};

const PixelateFilter =
filters.PixelateFilter ||
PIXIFilters.PixelateFilter;

const AdvancedBloomFilter =
filters.AdvancedBloomFilter ||
PIXIFilters.AdvancedBloomFilter;

const VoidFilter =
filters.VoidFilter ||
PIXIFilters.VoidFilter;

/* =========================================================
EMBERS
========================================================= */

class Ember {
constructor(
colors,
app,
pixelate = false
) {
this.emberBlobs = [];
this.embers =
new PIXI.Container();


this.interval = null;

if (
  pixelate &&
  PixelateFilter
) {
  this.embers.filters = [
    new PixelateFilter(),
  ];
}

colors.forEach(
  (color) => {
    const circle =
      new PIXI.Graphics();

    circle.lineStyle(0);
    circle.beginFill(
      color,
      1
    );

    circle.drawCircle(
      0,
      0,
      10
    );

    circle.endFill();

    this.emberBlobs.push(
      app.renderer.generateTexture(
        circle
      )
    );

    circle.destroy();
  }
);

this.interval =
  window.setInterval(
    () => {
      this.addEmber();
    },
    300
  );


}

get time() {
return (
2 +
Math.random() * 1.5
);
}

makeBlob() {
const texture =
this.emberBlobs[
Math.floor(
Math.random() *
this.emberBlobs.length
)
];


const blob =
  new PIXI.Sprite(
    texture
  );

blob.anchor.set(0.5);

const scaleScale =
  Math.random();

blob.scale.set(
  0.4 * scaleScale,
  0.5 * scaleScale
);

return blob;


}

addEmber() {
if (
!this.emberBlobs.length
) {
return;
}


const time =
  this.time *
  (
    0.3 +
    Math.random() * 0.6
  );

const blob =
  this.makeBlob();

this.embers.addChild(
  blob
);

const bezier = [
  {
    x:
      Math.random() * 100 -
      50,
    y: -100,
  },
  {
    x:
      Math.random() * 200 -
      100,
    y:
      -100 -
      Math.random() * 20,
  },
  {
    x:
      Math.random() * 200 -
      100,
    y:
      -100 -
      Math.random() * 50,
  },
  {
    x:
      Math.random() * 300 -
      150,
    y:
      -200 -
      Math.random() * 50,
  },
  {
    x:
      Math.random() * 500 -
      250,
    y:
      -250 -
      Math.random() * 100,
  },
  {
    x:
      Math.random() * 500 -
      250,
    y:
      -500 -
      Math.random() * 150,
  },
];

TweenMax.to(
  blob,
  time / 2,
  {
    delay:
      time / 2,
    ease:
      Power1.easeOut,
    alpha: 0,
  }
);

TweenMax.to(
  blob.position,
  time,
  {
    ease:
      Power1.easeOut,
    bezier,
    onComplete: () => {
      if (blob.parent) {
        blob.parent.removeChild(
          blob
        );
      }

      blob.destroy();
    },
  }
);


}

stoke() {
const amount =
40 +
Math.round(
Math.random() * 20
);


for (
  let i = 0;
  i < amount;
  i++
) {
  this.addEmber();
}


}

destroy() {
if (this.interval) {
window.clearInterval(
this.interval
);


  this.interval = null;
}

this.embers.removeChildren();

this.emberBlobs.forEach(
  (texture) => {
    if (
      texture &&
      texture.destroy
    ) {
      texture.destroy(
        true
      );
    }
  }
);

this.emberBlobs = [];


}
}

/* =========================================================
FIRE
========================================================= */

class Fire {
constructor(
color,
app,
pixelate = false
) {
this.flame =
new PIXI.Container();


this.cutout =
  new PIXI.Container();

this.fire =
  new PIXI.Container();

this.flame.addChild(
  this.fire
);


this.fire.alpha = 0.7;

this.interactiveBlobs = [];

this.interval = null;


/* Main fire texture */

const circle =
  new PIXI.Graphics();

circle.lineStyle(0);

circle.beginFill(
  color,
  1
);

circle.drawCircle(
  0,
  0,
  35
);

circle.endFill();

this.fireBlob =
  app.renderer.generateTexture(
    circle
  );

circle.destroy();


/* Cutout */

const cutoutCircle =
  new PIXI.Graphics();

cutoutCircle.lineStyle(0);

cutoutCircle.beginFill(
  0x000000,
  1
);

cutoutCircle.drawCircle(
  0,
  0,
  40
);

cutoutCircle.endFill();

this.cutoutBlob =
  app.renderer.generateTexture(
    cutoutCircle
  );

cutoutCircle.destroy();


/* Filters */

const bloom =
  AdvancedBloomFilter
    ? new AdvancedBloomFilter(
        0.45,
        0.5,
        0.5
      )
    : null;

const pixel =
  pixelate &&
  PixelateFilter
    ? new PixelateFilter()
    : null;

const voidFilter =
  VoidFilter
    ? new VoidFilter()
    : null;

const fireFilters = [
  bloom,
  pixel,
  voidFilter,
].filter(Boolean);

if (
  fireFilters.length
) {
  this.flame.filters =
    fireFilters;
}


/* Continuous flame generation */

this.interval =
  window.setInterval(
    () => {
      this.addFlame();

      this.addCutout(
        Math.random() > 0.5
      );
    },
    50
  );


}

get time() {
return (
1 +
Math.random() * 0.4
);
}

makeBlob(texture) {
const wrapper =
new PIXI.Container();


const sprite =
  new PIXI.Sprite(
    texture
  );

sprite.anchor.set(0.5);

wrapper.addChild(
  sprite
);

wrapper.__flameSprite =
  sprite;

wrapper.__targetX = 0;
wrapper.__targetY = 0;

wrapper.__currentX = 0;
wrapper.__currentY = 0;

wrapper.__targetRotation = 0;
wrapper.__currentRotation = 0;

wrapper.__targetScaleX = 1;
wrapper.__targetScaleY = 1;

wrapper.__currentScaleX = 1;
wrapper.__currentScaleY = 1;

this.interactiveBlobs.push(
  wrapper
);

return wrapper;


}

addCutout(left) {
const time =
this.time *
(
0.7 +
Math.random() * 0.2
);


const blob =
  new PIXI.Sprite(
    this.cutoutBlob
  );

blob.anchor.set(0.5);

this.cutout.addChild(
  blob
);

const scale = [
  1,
  0.75 +
    Math.random(),
];

blob.position.x =
  (
    130 +
    Math.random() * 50
  ) *
  (left ? -1 : 1);

const targetX =
  (
    5 +
    Math.random() * 60
  ) *
  (left ? -1 : 1);

blob.scale.set(
  scale[0]
);

TweenMax.to(
  blob,
  time,
  {
    ease:
      Power1.easeIn,

    pixi: {
      x: targetX,
      y: -270,
      scaleX: scale[1],
      scaleY: scale[1],
    },

    onComplete: () => {
      if (blob.parent) {
        blob.parent.removeChild(
          blob
        );
      }

      blob.destroy();
    },
  }
);


}

addFlame() {
const time =
this.time;


const blob =
  this.makeBlob(
    this.fireBlob
  );

this.fire.addChild(
  blob
);

const scale = [
  1.2 +
    Math.random(),

  0.5 +
    Math.random(),
];

const bezier = [
  {
    x: 0,
    y: 0,
  },
  {
    x:
      Math.random() * 100 -
      50,
    y:
      Math.random() * -20,
  },
  {
    x:
      Math.random() * 100 -
      50,
    y:
      Math.random() * -50 -
      50,
  },
  {
    x: 0,
    y:
      -150 -
      Math.random() * 100,
  },
];

blob.scale.set(
  scale[0]
);

TweenMax.to(
  blob,
  time,
  {
    ease:
      Power0.easeOut,
    bezier,
  }
);

TweenMax.to(
  blob,
  time,
  {
    pixi: {
      scaleX: scale[1],
      scaleY: scale[1],
    },

    onComplete: () => {
      const index =
        this.interactiveBlobs.indexOf(
          blob
        );

      if (index !== -1) {
        this.interactiveBlobs.splice(
          index,
          1
        );
      }

      if (blob.parent) {
        blob.parent.removeChild(
          blob
        );
      }

      blob.destroy({
        children: true,
      });
    },
  }
);


}

updateInteraction(
globalMouseX,
globalMouseY,
velocityX,
velocityY
) {
const globalPoint =
new PIXI.Point(
globalMouseX,
globalMouseY
);


const localMouse =
  this.fire.toLocal(
    globalPoint
  );

const mouseX =
  localMouse.x;

const mouseY =
  localMouse.y;

for (
  let i = 0;
  i <
  this.interactiveBlobs.length;
  i++
) {
  const blob =
    this.interactiveBlobs[i];

  if (
    !blob ||
    !blob.parent ||
    !blob.__flameSprite
  ) {
    continue;
  }

  const sprite =
    blob.__flameSprite;

  const dx =
    mouseX -
    blob.position.x;

  const dy =
    mouseY -
    blob.position.y;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  const radius = 190;

  if (
    distance <
    radius
  ) {
    const strength =
      1 -
      distance /
        radius;

    const speed =
      Math.sqrt(
        velocityX *
          velocityX +
        velocityY *
          velocityY
      );

    const speedInfluence =
      Math.min(
        speed / 45,
        1.5
      );

    const directionX =
      dx /
      Math.max(
        distance,
        1
      );

    const directionY =
      dy /
      Math.max(
        distance,
        1
      );

    const push =
      strength *
      32 *
      (
        1 +
        speedInfluence
      );

    blob.__targetX =
      -directionX *
      push;

    blob.__targetY =
      -directionY *
      push *
      0.35;

    blob.__targetX +=
      velocityX *
      strength *
      0.8;

    blob.__targetY +=
      velocityY *
      strength *
      0.2;

    blob.__targetRotation =
      -directionX *
      strength *
      0.35;

    blob.__targetScaleX =
      1 +
      strength *
      0.35 *
      (
        1 +
        speedInfluence
      );

    blob.__targetScaleY =
      1 -
      strength *
      0.12;
  } else {
    blob.__targetX = 0;
    blob.__targetY = 0;

    blob.__targetRotation = 0;

    blob.__targetScaleX = 1;
    blob.__targetScaleY = 1;
  }

  blob.__currentX +=
    (
      blob.__targetX -
      blob.__currentX
    ) *
    0.16;

  blob.__currentY +=
    (
      blob.__targetY -
      blob.__currentY
    ) *
    0.16;

  blob.__currentRotation +=
    (
      blob.__targetRotation -
      blob.__currentRotation
    ) *
    0.12;

  blob.__currentScaleX +=
    (
      blob.__targetScaleX -
      blob.__currentScaleX
    ) *
    0.12;

  blob.__currentScaleY +=
    (
      blob.__targetScaleY -
      blob.__currentScaleY
    ) *
    0.12;

  sprite.position.x =
    blob.__currentX;

  sprite.position.y =
    blob.__currentY;

  sprite.rotation =
    blob.__currentRotation;

  sprite.scale.x =
    blob.__currentScaleX;

  sprite.scale.y =
    blob.__currentScaleY;
}


}

destroy() {
if (this.interval) {
window.clearInterval(
this.interval
);


  this.interval = null;
}

this.interactiveBlobs = [];

this.flame.destroy({
  children: true,
});


}

set x(value) {
this.flame.position.x =
value;
}

set y(value) {
this.flame.position.y =
value;
}

set scale(value) {
this.flame.scale.set(
value
);
}
}

/* =========================================================
FIRE ENGINE
========================================================= */

function createFire(container) {
const app =
new PIXI.Application(
window.innerWidth,
window.innerHeight,
{
antialias: true,


    transparent: true,

    backgroundAlpha: 0,

    resolution:
      window.devicePixelRatio ||
      1,

    autoResize: true,
  }
);


const canvas =
app.view;

canvas.style.position =
"absolute";

canvas.style.inset = "0";

canvas.style.width =
"100%";

canvas.style.height =
"100%";

canvas.style.pointerEvents =
"none";

canvas.style.display =
"block";

container.appendChild(
canvas
);

const stage =
new PIXI.Container();

const flamesContainer =
new PIXI.Container();

stage.addChild(
flamesContainer
);

app.stage.addChild(
stage
);

flamesContainer.scale.set(
0.15
);

/* Blue fire */

const flameSettings = [
{
color: 0x081c38,   // near-black navy (deepest shadow, matches dark wall gaps)
scale: 1,
offset: -30,
},
{
color: 0x0f3a5c,   // dark steel-blue (matches armor shadow tones)
scale: 1,
offset: -10,
},
{
color: 0x1c6f8c,   // muted teal (matches the mid-glow on the walls/energy)
scale: 0.9,
offset: 10,
},
{
color: 0x2a9bb0,   // deeper cyan-teal (closest to the visible wisp glow, but not blown out)
scale: 0.7,
offset: 30,
},
];

const ember =
new Ember(
[
0x008cff,
0x00c8ff,
0x7eeeff,
],
app,
false
);

flamesContainer.addChild(
ember.embers
);

const fireObjects = [];

flameSettings.forEach(
(settings) => {
const fire =
new Fire(
settings.color,
app,
false
);


  fire.y =
    settings.offset;

  fire.scale =
    settings.scale;

  fire.flame.pivot.set(
    0,
    10
  );

  fireObjects.push(
    fire
  );

  flamesContainer.addChild(
    fire.flame
  );
}


);

/* Position */

const updatePosition =
() => {
app.renderer.resize(
window.innerWidth,
window.innerHeight
);


  stage.position.x =
    window.innerWidth *
    0.60;

  stage.position.y =
    window.innerHeight *
    0.36;
};


updatePosition();

/* Click burst */

const animatedFireObjects =
fireObjects
.map(
(fire) =>
fire.flame
)
.slice(0, -1);

const stokeAnimation =
new TimelineMax({
paused: true,
});

stokeAnimation.to(
animatedFireObjects,
0.3,
{
ease:
Power2.easeOut,


  pixi: {
    scaleY: 1.2,
    scaleX: 1.15,
  },
}


);

stokeAnimation.to(
animatedFireObjects,
1.4,
{
ease:
Bounce.easeOut,


  pixi: {
    scaleY: 1,
    scaleX: 1,
  },
}


);

/* Mouse */

const mouse = {
x: -9999,
y: -9999,
};

const previousMouse = {
x: -9999,
y: -9999,
};

const mouseVelocity = {
x: 0,
y: 0,
};

const handleMouseMove =
(event) => {
previousMouse.x =
mouse.x;


  previousMouse.y =
    mouse.y;

  mouse.x =
    event.clientX;

  mouse.y =
    event.clientY;

  mouseVelocity.x =
    mouse.x -
    previousMouse.x;

  mouseVelocity.y =
    mouse.y -
    previousMouse.y;
};


const handleMouseLeave =
() => {
mouse.x = -9999;
mouse.y = -9999;


  mouseVelocity.x = 0;
  mouseVelocity.y = 0;
};


const handleClick =
() => {
ember.stoke();


  stokeAnimation.restart();
};


window.addEventListener(
"mousemove",
handleMouseMove
);

window.addEventListener(
"mouseleave",
handleMouseLeave
);

window.addEventListener(
"click",
handleClick
);

window.addEventListener(
"resize",
updatePosition
);

const tickerFunction =
() => {
mouseVelocity.x *=
0.88;


  mouseVelocity.y *=
    0.88;

  fireObjects.forEach(
    (fire) => {
      fire.updateInteraction(
        mouse.x,
        mouse.y,
        mouseVelocity.x,
        mouseVelocity.y
      );
    }
  );
};


app.ticker.add(
tickerFunction
);

return () => {
window.removeEventListener(
"mousemove",
handleMouseMove
);


window.removeEventListener(
  "mouseleave",
  handleMouseLeave
);

window.removeEventListener(
  "click",
  handleClick
);

window.removeEventListener(
  "resize",
  updatePosition
);

app.ticker.remove(
  tickerFunction
);

ember.destroy();

fireObjects.forEach(
  (fire) => {
    fire.destroy();
  }
);

stokeAnimation.kill();

app.destroy(
  true,
  {
    children: true,
    texture: true,
    baseTexture: true,
  }
);


};
}

/* =========================================================
REACT COMPONENT
========================================================= */

export default function FireEffect() {
const containerRef =
useRef(null);

useEffect(() => {
if (
!containerRef.current
) {
return undefined;
}


return createFire(
  containerRef.current
);


}, []);

return ( <div
   ref={containerRef}
   className="scene3-fire"
   aria-hidden="true"
 />
);
}
