const audioUrlInput = document.getElementById("audioUrl");
const loadBtn = document.getElementById("loadBtn");
const playBtn = document.getElementById("playBtn");
const fileInput = document.getElementById("fileInput");
const patternSelect = document.getElementById("patternSelect");
const particleSelect = document.getElementById("particleSelect");

const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.loop = true;

let audioCtx = null;
let analyser = null;
let dataArray = null;
let sourceNode = null;
let isPlaying = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 0, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const point = new THREE.PointLight(0x66ccff, 1.2, 120);
point.position.set(20, 20, 20);
scene.add(point);

const particleCount = 4000;
const positions = new Float32Array(particleCount * 3);
const basePositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const r = 12 + Math.random() * 8;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  basePositions[i * 3] = x;
  basePositions[i * 3 + 1] = y;
  basePositions[i * 3 + 2] = z;
  colors[i * 3] = 0.2;
  colors[i * 3 + 1] = 0.7;
  colors[i * 3 + 2] = 1.0;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: 0.3,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const moireUniforms = {
  uTime: { value: 0 },
  uBeat: { value: 0 },
  uEnergy: { value: 0 },
  uPattern: { value: 0 },
};

const moireMaterial = new THREE.ShaderMaterial({
  uniforms: moireUniforms,
  transparent: true,
  depthWrite: false,
  vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
  fragmentShader: `
          precision mediump float;
          varying vec2 vUv;
          uniform float uTime;
          uniform float uBeat;
          uniform float uEnergy;
          uniform float uPattern;
          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            float r = length(uv);
            float angle = atan(uv.y, uv.x);
            float moire = 0.0;
            if (uPattern < 0.5) {
              float waves = sin(r * 30.0 + uTime * 1.8);
              float rings = sin(r * 45.0 - uTime * 1.2);
              float swirl = sin(angle * 8.0 + uTime * 0.6);
              moire = (waves + rings + swirl) * 0.35;
            } else if (uPattern < 1.5) {
              float diagA = sin((uv.x + uv.y) * 38.0 + uTime * 1.4);
              float diagB = sin((uv.x - uv.y) * 28.0 - uTime * 1.1);
              float ripple = sin(r * 18.0 + uTime * 2.2);
              moire = (diagA + diagB + ripple) * 0.35;
            } else {
              float gridX = sin(uv.x * 46.0 + uTime * 1.2);
              float gridY = sin(uv.y * 46.0 - uTime * 1.2);
              float rings = sin(r * 36.0 + uTime * 1.6);
              moire = (gridX + gridY + rings) * 0.35;
            }
            float pulse = 0.2 + uBeat * 0.8;
            float alpha = smoothstep(1.2, 0.2, r) * (0.25 + uEnergy * 0.4 + pulse * 0.25);
            vec3 base = mix(vec3(0.1, 0.2, 0.4), vec3(0.8, 0.4, 1.0), moire + 0.5);
            gl_FragColor = vec4(base, alpha);
          }
        `,
});

const moirePlane = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  moireMaterial,
);
moirePlane.position.z = -10;
scene.add(moirePlane);

let beatPulse = 0;
let energyAverage = 0;
let particleMode = "orb";

function setupAudioContext() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(analyser);

  analyser.connect(audioCtx.destination);
}

function analyzeAudio() {
  if (!analyser) {
    return { energy: 0, bass: 0 };
  }
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  let bassSum = 0;
  const bassBins = 20;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
    if (i < bassBins) bassSum += dataArray[i];
  }
  const energy = sum / dataArray.length / 255;
  const bass = bassSum / bassBins / 255;
  return { energy, bass };
}

function updateParticles(time, energy, bass) {
  const pos = geometry.attributes.position.array;
  const col = geometry.attributes.color.array;
  const pulse = 1 + bass * 0.8;
  const wobble = Math.sin(time * 0.001) * 0.2;
  const t = time * 0.001;

  for (let i = 0; i < particleCount; i++) {
    const bx = basePositions[i * 3];
    const by = basePositions[i * 3 + 1];
    const bz = basePositions[i * 3 + 2];
    const idx = i * 3;
    const noise = Math.sin(time * 0.002 + i * 0.05) * 0.6;
    const scale = 1 + energy * 0.5 + noise * 0.02;
    if (particleMode === "spiral") {
      const angle = t * 0.6 + i * 0.005;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const sx = bx * cosA - bz * sinA;
      const sz = bx * sinA + bz * cosA;
      pos[idx] = sx * scale * pulse;
      pos[idx + 1] = by * scale * pulse + Math.sin(t + i * 0.01) * 2.5;
      pos[idx + 2] = sz * scale + wobble * 4;
    } else if (particleMode === "waves") {
      const wave = Math.sin(bx * 0.3 + t * 2.4) * 2.2;
      const wave2 = Math.cos(by * 0.3 - t * 2.1) * 2.2;
      pos[idx] = bx * scale * pulse + wave;
      pos[idx + 1] = by * scale * pulse + wave2;
      pos[idx + 2] = (bz + wobble * 4) * scale;
    } else {
      pos[idx] = bx * scale * pulse;
      pos[idx + 1] = by * scale * pulse;
      pos[idx + 2] = (bz + wobble * 4) * scale;
    }

    const hueShift = 0.2 + energy * 0.6;
    col[idx] = 0.1 + hueShift * 0.6;
    col[idx + 1] = 0.3 + bass * 0.7;
    col[idx + 2] = 0.9;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  material.size = 0.25 + energy * 0.6 + bass * 0.4;
}

function animate(time) {
  requestAnimationFrame(animate);
  const analysis = analyzeAudio();
  energyAverage = energyAverage * 0.95 + analysis.energy * 0.05;
  const beatThreshold = energyAverage * 1.4;
  if (analysis.bass > beatThreshold && analysis.bass > 0.15) {
    beatPulse = 1.0;
  }
  beatPulse *= 0.9;

  moireUniforms.uTime.value = time * 0.001;
  moireUniforms.uBeat.value = beatPulse;
  moireUniforms.uEnergy.value = analysis.energy;
  moireUniforms.uPattern.value = Number(patternSelect.value);

  updateParticles(time, analysis.energy, analysis.bass);
  points.rotation.y += 0.001 + analysis.energy * 0.01;
  points.rotation.x += 0.0005 + analysis.bass * 0.006;

  renderer.render(scene, camera);
}

loadBtn.addEventListener("click", () => {
  const url = audioUrlInput.value.trim();
  if (!url) return;
  audio.src = url;
  audio.load();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  audio.load();
});

playBtn.addEventListener("click", async () => {
  setupAudioContext();
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  if (!audio.src) return;
  if (isPlaying) {
    audio.pause();
    playBtn.textContent = "Play";
    isPlaying = false;
  } else {
    await audio.play();
    playBtn.textContent = "Pause";
    isPlaying = true;
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

particleSelect.addEventListener("change", (event) => {
  particleMode = event.target.value;
});

animate(0);
