import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const layers = Array.from(document.querySelectorAll(".parallax-layer"));
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
const floatingCards = Array.from(
  document.querySelectorAll(".floating-list .experiment-card"),
);
let particles = [];
let lastScrollY = window.scrollY;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles(count = 240) {
  particles = Array.from({ length: count }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: 1 + Math.random() * 5.5,
    speed: 0.2 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 0.4,
  }));
}

function drawParticles(scrollDelta) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(220, 210, 235, 0.5)";
  for (const p of particles) {
    p.y += p.speed + scrollDelta * 0.02;
    p.x += p.drift;
    if (p.y > canvas.height + 20) p.y = -20;
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.x < -20) p.x = canvas.width + 20;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateParallax() {
  const scrollY = window.scrollY;
  const delta = scrollY - lastScrollY;
  layers.forEach((layer) => {
    const depth = Number(layer.dataset.depth || 0.1);
    const translateY = scrollY * depth;
    layer.style.transform = `translate3d(0, ${translateY}px, 0)`;
  });
  floatingCards.forEach((card) => {
    const randX = Number(card.dataset.randX || 0);
    const randY = Number(card.dataset.randY || 0);
    const randZ = Number(card.dataset.randZ || 0);
    const scrollOffset = scrollY * 0.08;
    card.style.transform = `translate3d(${randX}px, ${randY + scrollOffset}px, ${randZ}px)`;
  });
  drawParticles(delta);
  lastScrollY = scrollY;
}

window.addEventListener("scroll", updateParallax);
window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
  updateParallax();
});

floatingCards.forEach((card, index) => {
  const spread = 0;
  const sign = index % 2 === 0 ? 1 : -1;
  card.dataset.randX = (Math.random() * spread + 40) * sign;
  card.dataset.randY = Math.random() * 60 - 30;
  card.dataset.randZ = Math.random() * 80;
});

resizeCanvas();
createParticles();
updateParallax();

const heroCanvas = document.getElementById("hero-canvas");
const heroScene = new THREE.Scene();
const heroCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
heroCamera.position.set(0, 2, 10);
const heroRenderer = new THREE.WebGLRenderer({
  canvas: heroCanvas,
  alpha: true,
  antialias: true,
});
heroRenderer.setPixelRatio(window.devicePixelRatio || 1);

const heroAmbient = new THREE.AmbientLight(0xffffff, 0.9);
heroScene.add(heroAmbient);
const heroKey = new THREE.DirectionalLight(0xffffff, 0.9);
heroKey.position.set(1.2, 1.4, 2);
heroScene.add(heroKey);

let heroModel = null;
const heroRaycaster = new THREE.Raycaster();
const heroPointer = new THREE.Vector2();
const polygonModes = ["shrink", "rotate", "explode"];
const polygonUniforms = {
  uTime: { value: 0 },
  uShrink: { value: 0 },
  uRotate: { value: 0 },
  uExplosion: { value: 0 },
};
const polygonState = {
  modeIndex: -1,
  changedAt: 0,
};
const headTextureCanvas = document.createElement("canvas");
headTextureCanvas.width = 384;
headTextureCanvas.height = 384;
const headTextureCtx = headTextureCanvas.getContext("2d");
const headTexture = new THREE.CanvasTexture(headTextureCanvas);
headTexture.colorSpace = THREE.SRGBColorSpace;
headTexture.wrapS = THREE.RepeatWrapping;
headTexture.wrapT = THREE.RepeatWrapping;
headTexture.center.set(0.5, 0.5);
headTexture.repeat.set(2.35, 2.35);

const headMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: headTexture,
  emissive: 0x2e1846,
  emissiveMap: headTexture,
  emissiveIntensity: 0.58,
  metalness: 0.04,
  roughness: 0.26,
});

headMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = polygonUniforms.uTime;
  shader.uniforms.uShrink = polygonUniforms.uShrink;
  shader.uniforms.uRotate = polygonUniforms.uRotate;
  shader.uniforms.uExplosion = polygonUniforms.uExplosion;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    `#include <common>
attribute vec3 aFaceCenter;
attribute vec3 aExplodeDir;
attribute vec3 aSpinAxis;
attribute float aTriPhase;
uniform float uTime;
uniform float uShrink;
uniform float uRotate;
uniform float uExplosion;

mat3 axisRotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c,
    oc * axis.x * axis.y - axis.z * s,
    oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,
    oc * axis.y * axis.y + c,
    oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,
    oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.z + c
  );
}`,
  );
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `vec3 faceCenter = aFaceCenter;
vec3 polygonOffset = position - faceCenter;
float shrinkScale = mix(1.0, 0.48, uShrink);
float spinWave = sin(uTime * 1.65 + aTriPhase * 6.28318);
float spinAngle = uRotate * (1.25 + spinWave * 0.7);
float explodeSpin = uExplosion * sin(uTime * 2.8 + aTriPhase * 9.0) * 0.75;
polygonOffset = axisRotationMatrix(aSpinAxis, spinAngle + explodeSpin) * polygonOffset;
vec3 transformed = faceCenter + polygonOffset * shrinkScale;
float explosionStagger = 0.62 + aTriPhase * 0.72;
transformed += aExplodeDir * uExplosion * explosionStagger;`,
  );
};

headMaterial.customProgramCacheKey = () => "animated-head-polygons";

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function updatePolygonTransform(timeSeconds) {
  const mode = polygonModes[polygonState.modeIndex];
  const transition = easeInOut(
    Math.min((timeSeconds - polygonState.changedAt) / 0.72, 1),
  );
  polygonUniforms.uTime.value = timeSeconds;
  polygonUniforms.uShrink.value = mode === "shrink" ? transition : 0;
  polygonUniforms.uRotate.value = mode === "rotate" ? transition : 0;

  if (mode === "explode") {
    const elapsed = timeSeconds - polygonState.changedAt;
    const blast = Math.sin(Math.min(elapsed / 1.15, 1) * Math.PI);
    const rumble = 0.18 + Math.sin(timeSeconds * 2.6) * 0.08;
    polygonUniforms.uExplosion.value = transition * (0.38 + blast * 0.72 + rumble);
  } else {
    polygonUniforms.uExplosion.value = 0;
  }
}

function drawHeadTexture(timeSeconds) {
  const { width, height } = headTextureCanvas;
  const ctxGradient = headTextureCtx.createLinearGradient(
    Math.sin(timeSeconds * 0.27) * width * 0.5 + width * 0.5,
    0,
    Math.cos(timeSeconds * 0.19) * width * 0.5 + width * 0.5,
    height,
  );
  ctxGradient.addColorStop(0, "#00e7d0");
  ctxGradient.addColorStop(0.3, "#6f59ff");
  ctxGradient.addColorStop(0.58, "#ff4fa6");
  ctxGradient.addColorStop(0.78, "#ff9f45");
  ctxGradient.addColorStop(1, "#fff275");

  headTextureCtx.fillStyle = ctxGradient;
  headTextureCtx.fillRect(0, 0, width, height);
  headTextureCtx.globalCompositeOperation = "screen";

  for (let i = 0; i < 18; i += 1) {
    const phase = timeSeconds * (0.42 + i * 0.018) + i * 0.75;
    const centerY = height * (0.5 + Math.sin(phase) * 0.34);
    const amplitude = 22 + Math.sin(timeSeconds * 0.31 + i) * 12;
    headTextureCtx.beginPath();
    for (let x = -24; x <= width + 24; x += 12) {
      const y =
        centerY +
        Math.sin(x * 0.026 + phase) * amplitude +
        Math.cos(x * 0.011 - phase * 1.8) * 16;
      if (x === -24) {
        headTextureCtx.moveTo(x, y);
      } else {
        headTextureCtx.lineTo(x, y);
      }
    }
    headTextureCtx.lineWidth = 7 + (i % 5);
    headTextureCtx.strokeStyle = `hsla(${(timeSeconds * 36 + i * 24) % 360}, 98%, 70%, 0.34)`;
    headTextureCtx.stroke();
  }

  headTextureCtx.globalCompositeOperation = "multiply";
  headTextureCtx.fillStyle = "rgba(18, 8, 36, 0.3)";
  for (let y = 0; y < height; y += 18) {
    const offset = Math.sin(timeSeconds * 1.2 + y * 0.04) * 18;
    headTextureCtx.fillRect(offset, y, width, 5);
  }

  headTextureCtx.globalCompositeOperation = "source-over";
  headTextureCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
  for (let i = 0; i < 28; i += 1) {
    const x =
      (Math.sin(timeSeconds * (0.33 + i * 0.01) + i * 1.7) * 0.5 + 0.5) *
      width;
    const y =
      (Math.cos(timeSeconds * (0.29 + i * 0.012) + i * 2.3) * 0.5 + 0.5) *
      height;
    headTextureCtx.beginPath();
    headTextureCtx.arc(x, y, 2 + (i % 5), 0, Math.PI * 2);
    headTextureCtx.fill();
  }

  headTexture.offset.x = Math.sin(timeSeconds * 0.18) * 0.18;
  headTexture.offset.y = timeSeconds * 0.045;
  headTexture.rotation = Math.sin(timeSeconds * 0.16) * 0.18;
  headTexture.needsUpdate = true;
}

function addPolygonAttributes(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = source.getAttribute("position");
  const faceCenters = [];
  const explodeDirs = [];
  const spinAxes = [];
  const phases = [];
  const center = new THREE.Vector3();
  const vertexA = new THREE.Vector3();
  const vertexB = new THREE.Vector3();
  const vertexC = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 3) {
    vertexA.fromBufferAttribute(position, i);
    vertexB.fromBufferAttribute(position, i + 1);
    vertexC.fromBufferAttribute(position, i + 2);
    center.copy(vertexA).add(vertexB).add(vertexC).divideScalar(3);
    normal
      .crossVectors(
        edgeAB.subVectors(vertexB, vertexA),
        edgeAC.subVectors(vertexC, vertexA),
      )
      .normalize();
    const explodeDir = normal.clone().multiplyScalar(0.55).add(center).normalize();
    const phase = Math.abs(Math.sin(center.x * 21.17 + center.y * 13.31 + center.z * 9.73));
    const spinAxis = new THREE.Vector3(
      Math.sin(phase * 6.1 + center.y),
      Math.cos(phase * 4.7 + center.z),
      Math.sin(phase * 5.3 + center.x),
    ).normalize();

    for (let j = 0; j < 3; j += 1) {
      faceCenters.push(center.x, center.y, center.z);
      explodeDirs.push(explodeDir.x, explodeDir.y, explodeDir.z);
      spinAxes.push(spinAxis.x, spinAxis.y, spinAxis.z);
      phases.push(phase);
    }
  }

  source.setAttribute("aFaceCenter", new THREE.Float32BufferAttribute(faceCenters, 3));
  source.setAttribute("aExplodeDir", new THREE.Float32BufferAttribute(explodeDirs, 3));
  source.setAttribute("aSpinAxis", new THREE.Float32BufferAttribute(spinAxes, 3));
  source.setAttribute("aTriPhase", new THREE.Float32BufferAttribute(phases, 1));
  source.computeVertexNormals();
  return source;
}

function applyHeadMaterial(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry = addPolygonAttributes(child.geometry);
    child.material = headMaterial;
  });
}

function cyclePolygonMode() {
  polygonState.modeIndex = (polygonState.modeIndex + 1) % polygonModes.length;
  polygonState.changedAt = performance.now() * 0.001;
}

function wasHeroClick() {
  return heroDrag.totalDistance < 8;
}

function didHitHeroModel(e) {
  if (!heroModel) return false;
  const rect = heroCanvas.getBoundingClientRect();
  heroPointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  heroPointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  heroRaycaster.setFromCamera(heroPointer, heroCamera);
  return heroRaycaster.intersectObject(heroModel, true).length > 0;
}

const loader = new GLTFLoader();
const modelUrl = new URL("../media/ryan_nontext.glb", import.meta.url);
loader.load(modelUrl.href, (gltf) => {
  heroModel = gltf.scene;
  heroModel.scale.set(5, 5, 5);
  applyHeadMaterial(heroModel);
  heroScene.add(heroModel);
});

function resizeHeroCanvas() {
  const rect = heroCanvas.getBoundingClientRect();
  heroCamera.aspect = rect.width / rect.height;
  heroCamera.updateProjectionMatrix();
  heroRenderer.setSize(rect.width, rect.height, false);
}

let heroDrag = { active: false, lastX: 0, lastY: 0 };
const ROTATE_SPEED = 0.005;

function onHeroPointerDown(e) {
  heroDrag.active = true;
  heroDrag.lastX = e.clientX;
  heroDrag.lastY = e.clientY;
  heroDrag.totalDistance = 0;
  heroCanvas.setPointerCapture(e.pointerId);
  heroCanvas.style.cursor = "grabbing";
}

function onHeroPointerMove(e) {
  if (!heroDrag.active || !heroModel) return;
  const dx = e.clientX - heroDrag.lastX;
  const dy = e.clientY - heroDrag.lastY;
  heroDrag.totalDistance += Math.hypot(dx, dy);
  heroModel.rotation.y += dx * ROTATE_SPEED;
  heroModel.rotation.x += dy * ROTATE_SPEED;
  heroModel.rotation.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, heroModel.rotation.x),
  );
  heroDrag.lastX = e.clientX;
  heroDrag.lastY = e.clientY;
}

function onHeroPointerUp(e) {
  const shouldCycle = e && wasHeroClick() && didHitHeroModel(e);
  heroDrag.active = false;
  if (e && e.pointerId !== undefined)
    heroCanvas.releasePointerCapture(e.pointerId);
  heroCanvas.style.cursor = "grab";
  if (shouldCycle) cyclePolygonMode();
}

heroCanvas.addEventListener("pointerdown", onHeroPointerDown);
heroCanvas.addEventListener("pointermove", onHeroPointerMove);
heroCanvas.addEventListener("pointerup", onHeroPointerUp);
heroCanvas.addEventListener("pointerleave", onHeroPointerUp);
heroCanvas.style.cursor = "grab";

function animateHero() {
  requestAnimationFrame(animateHero);
  const timeSeconds = performance.now() * 0.001;
  drawHeadTexture(timeSeconds);
  updatePolygonTransform(timeSeconds);
  if (heroModel && !heroDrag.active) {
    heroModel.rotation.y += 0.004;
  }
  heroRenderer.render(heroScene, heroCamera);
}

resizeHeroCanvas();
animateHero();
//heroRenderer.setAnimationLoop(animateHero);

window.addEventListener("resize", resizeHeroCanvas);
