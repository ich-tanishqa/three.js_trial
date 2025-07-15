// main.js  –  beating heart + continuous ECG  (heart geometry UNCHANGED)

// 1. Scene -----------------------------------------------------------------
const scene = new THREE.Scene();

// 2. Camera ----------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 10);

// 3. Renderer --------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);      // crisp on Hi‑DPI
document.body.appendChild(renderer.domElement);

// 4. Heart geometry  (YOUR ORIGINAL CODE — unchanged) ----------------------
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
geometry.scale(1, -1, 1);            // keep it upright

const material = new THREE.MeshPhongMaterial({ color: 0xff0033 });
const heart    = new THREE.Mesh(geometry, material);
scene.add(heart);

// 5. ECG line --------------------------------------------------------------
const linePoints = [];
const X_START = -6;               // further left
const X_END   =  6;               // further right
const STEP    = 0.04;

for (let x = X_START; x <= X_END; x += STEP) {
  linePoints.push(new THREE.Vector3(x, 0, -0.5));
}
// for (let i = 0; i <= 50; i++) {
//   linePoints.push(new THREE.Vector3(-3 + i * 0.12, 0, -0.5));
// }
const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6666 });
const line         = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

// 6. Lights ----------------------------------------------------------------
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// 7. Resize handler --------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 8. Pulse logic constants -------------------------------------------------
const pulseTypes  = [
  { height: 2.5, inverted: false },
  { height: 2.0, inverted: false },
  { height: 1.5, inverted: true  },
  { height: 1.0, inverted: false }
];
const pulseWidth  = 0.2;
const leftEdge    = -6;
const rightEdge   = 6 + pulseWidth;

const speed       = 0.10;   // units per frame  (same as your old pulsePos += 0.15)
const separation  = 4;      // desired gap between consecutive spikes   ← NEW

/* keep an array of active pulses instead of a single pulsePos/currentPulse */
const pulses = [
  { pos: leftEdge, type: Math.floor(Math.random() * pulseTypes.length) }
];


const posArray    = lineGeometry.attributes.position.array;


function animate() {
    requestAnimationFrame(animate);
  
    /* ---- beating heart ---- */
    const beat = 1 + 0.12 * Math.sin(Date.now() * 0.003);
    heart.scale.set(beat, beat, beat);
  
    /* ---- clear ECG Y values ---- */
    for (let i = 1; i < posArray.length; i += 3) posArray[i] = 0;
  
    /* ---- spawn a new pulse if needed ---- */
    const lastPulse = pulses[pulses.length - 1];
    if (lastPulse.pos > leftEdge + separation) {
      pulses.push({
        pos : leftEdge,
        type: Math.floor(Math.random() * pulseTypes.length)
      });
    }
  
    /* ---- update each pulse ---- */
    for (let p = 0; p < pulses.length; p++) {
      const pulse = pulses[p];
  
      /* draw this pulse onto the line */
      for (let i = 0; i < posArray.length; i += 3) {
        const x    = posArray[i];
        const dist = Math.abs(x - pulse.pos)*0.5;
        if (dist < pulseWidth) {
          const k = 1 - dist / pulseWidth;                 // triangular fall‑off
          const { height, inverted } = pulseTypes[pulse.type];
          const y = k * height * (inverted ? -1 : 1);
  
          /* keep the largest absolute displacement so overlapping pulses merge */
          if (Math.abs(y) > Math.abs(posArray[i + 1])) posArray[i + 1] = y;
        }
      }
  
      /* advance this pulse */
      pulse.pos += speed;
    }
  
    /* ---- remove pulses that have moved off‑screen ---- */
    while (pulses.length && pulses[0].pos > rightEdge) pulses.shift();
  
    lineGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();