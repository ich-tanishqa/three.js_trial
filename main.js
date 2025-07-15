

// main.js  –  beating heart

// 1. Scene
const scene = new THREE.Scene();

// 2. Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 10);

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Heart geometry
const heartShape = new THREE.Shape();
const x = 0, y = 0;
heartShape.moveTo(x, y + 1.5);
heartShape.bezierCurveTo(x,     y + 0.3, x - 2, y + 0.3, x - 2, y + 1.5);
heartShape.bezierCurveTo(x - 2, y + 3,   x,     y + 4,   x,     y + 5);
heartShape.bezierCurveTo(x,     y + 4,   x + 2, y + 3,   x + 2, y + 1.5);
heartShape.bezierCurveTo(x + 2, y + 0.3, x,     y + 0.3, x,     y + 1.5);
const geometry = new THREE.ExtrudeGeometry(heartShape, {
  depth: 0.7,               // thickness
  bevelEnabled: false
});
geometry.center(); 
geometry.scale(1, -1, 1);

const linePoints = [];
for (let i = 0; i <= 100; i++) {
    linePoints.push(new THREE.Vector3(-6 + i * 0.12, 0, -0.5));
}

const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6666 });
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);


// 5. Material + mesh
const material = new THREE.MeshPhongMaterial({ color: 0xff0033 });
const heart   = new THREE.Mesh(geometry, material);
scene.add(heart);

// 6. Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// 7. Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 8. Animation loop – “beating” via scale pulse
// Add these variables before the animation loop
const pulseTypes = [
    { height: 2.4, inverted: false },    // high pulse
    { height: 2, inverted: false },    // medium pulse
    { height: 1.5, inverted: true },     // inverted pulse
    { height: 1, inverted: false },    // small pulse
];
let currentPulseIndex = 0;
let lastPulseTime = 0;
let pulsePosition = -2;  // Start position of pulse

function animate() {
    requestAnimationFrame(animate);

    const t = Date.now() * 0.003;
    const beat = 1 + 0.12 * Math.sin(t);
    heart.scale.set(beat, beat, beat);

    // Create new pulse randomly
    if (Date.now() - lastPulseTime > 400) {  // Check every second
        if (Math.random() < 0.5) {  // 50% chance to create new pulse
            currentPulseIndex = Math.floor(Math.random() * pulseTypes.length);
            pulsePosition = -3;  // Reset pulse position
            lastPulseTime = Date.now();
        }
    }

    // Animate pulse line
    const positions = line.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const distanceFromPulse = Math.abs(x - pulsePosition);
        const pulseWidth = 0.3;  // Width of the pulse
        
        if (distanceFromPulse < pulseWidth) {
            const pulseStrength = 1 - (distanceFromPulse / pulseWidth);
            const pulseType = pulseTypes[currentPulseIndex];
            positions[i + 1] = pulseStrength * pulseType.height * (pulseType.inverted ? -1 : 1);
        } else {
            positions[i + 1] = 0;  // Flat line
        }
    }
    
    pulsePosition += 0.05;  // Move pulse to the right
    line.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();

