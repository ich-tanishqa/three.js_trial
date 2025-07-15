// main.js  –  beating heart + TWO simultaneous ECG pulses
// (heart geometry UNCHANGED)

// ------------------------------------------------------------------ 1. Scene
const scene = new THREE.Scene();

// ---------------------------------------------------------------- 2. Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 10);

// ---------------------------------------------------------------- 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------- 4. Heart  (YOUR CODE)
const heartShape = new THREE.Shape();
const x = 0, y = 0;
heartShape.moveTo(x, y + 1.5);
heartShape.bezierCurveTo(x,     y + 0.3, x - 2, y + 0.3, x - 2, y + 1.5);
heartShape.bezierCurveTo(x - 2, y + 3,   x,     y + 4,   x,     y + 5);
heartShape.bezierCurveTo(x,     y + 4,   x + 2, y + 3,   x + 2, y + 1.5);
heartShape.bezierCurveTo(x + 2, y + 0.3, x,     y + 0.3, x,     y + 1.5);
const geometry = new THREE.ExtrudeGeometry(heartShape, {
  depth: 0.7,
  bevelEnabled: false
});
geometry.center();
geometry.scale(1, -1, 1);

const material = new THREE.MeshPhongMaterial({ color: 0xff0033 });
const heart    = new THREE.Mesh(geometry, material);
scene.add(heart);

// ---------------------------------------------------------------- 5. ECG line
const linePoints = [];
for (let i = 0; i <= 134; i++) {              // wider strip (‑8 → +8)
  linePoints.push(new THREE.Vector3(-8 + i * 0.12, 0, -0.5));
}
const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6666 });
const line         = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

// ---------------------------------------------------------------- 6. Lights
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(5, 10, 10));
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// ---------------------------------------------------------------- 7. Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------- 8. Pulse data
const pulseTypes = [
  { height: 2.4, inverted: false },
  { height: 2.0, inverted: false },
  { height: 1.5, inverted: true  },
  { height: 1.0, inverted: false }
];
const pulseWidth   = 0.3;
const leftEdge     = -8;
const rightEdge    =  8 + pulseWidth;
const pulseSpeed   = 3;                // units/second  ← adjust both pulses
const separation   = 4;                // distance between the two pulses ← NEW

// create two pulses
const pulses = [                       // ← NEW
  { pos: leftEdge,             type: Math.floor(Math.random()*pulseTypes.length) },
  { pos: leftEdge - separation, type: Math.floor(Math.random()*pulseTypes.length) }
];

const posArray = lineGeometry.attributes.position.array;
const clock    = new THREE.Clock();    // frame‑rate‑independent timing

// ---------------------------------------------------------------- 9. Animate
function animate() {
  requestAnimationFrame(animate);

  /* heart beat */
  const beat = 1 + 0.12 * Math.sin(Date.now() * 0.003);
  heart.scale.set(beat, beat, beat);

  /* clear line Y values */
  for (let i = 1; i < posArray.length; i += 3) posArray[i] = 0;

  /* draw pulses */
  const dt = clock.getDelta();         // seconds since last frame
  pulses.forEach(pulse => {
    // update vertex heights for this pulse
    for (let i = 0; i < posArray.length; i += 3) {
      const x    = posArray[i - 1];    // safe because we set Y above
      const dist = Math.abs(x - pulse.pos);
      if (dist < pulseWidth) {
        const k = 1 - dist / pulseWidth;
        const { height, inverted } = pulseTypes[pulse.type];
        const y = k * height * (inverted ? -1 : 1);
        posArray[i] = Math.max(posArray[i], y);   // keep tallest if overlap
      }
    }

    // advance & wrap
    pulse.pos += pulseSpeed * dt;
    if (pulse.pos > rightEdge) {
      pulse.pos  = leftEdge;
      pulse.type = Math.floor(Math.random() * pulseTypes.length);
    }
  });

  lineGeometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}
animate();
