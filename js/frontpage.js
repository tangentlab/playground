import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const layers = Array.from(document.querySelectorAll(".parallax-layer"));
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
const floatingCards = Array.from(document.querySelectorAll(".experiment-card"));
let particles = [];
let lastScrollY = window.scrollY;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles(count = 140) {
  particles = Array.from({ length: count }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: 1 + Math.random() * 2.5,
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
const loader = new GLTFLoader();
const modelUrl = new URL("../media/ryan_nontext.glb", import.meta.url);
loader.load(modelUrl.href, (gltf) => {
  heroModel = gltf.scene;
  heroModel.scale.set(5, 5, 5);
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
  heroCanvas.setPointerCapture(e.pointerId);
  heroCanvas.style.cursor = "grabbing";
}

function onHeroPointerMove(e) {
  if (!heroDrag.active || !heroModel) return;
  const dx = e.clientX - heroDrag.lastX;
  const dy = e.clientY - heroDrag.lastY;
  heroModel.rotation.y += dx * ROTATE_SPEED;
  heroModel.rotation.x += dy * ROTATE_SPEED;
  heroModel.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, heroModel.rotation.x));
  heroDrag.lastX = e.clientX;
  heroDrag.lastY = e.clientY;
}

function onHeroPointerUp(e) {
  heroDrag.active = false;
  if (e && e.pointerId !== undefined) heroCanvas.releasePointerCapture(e.pointerId);
  heroCanvas.style.cursor = "grab";
}

heroCanvas.addEventListener("pointerdown", onHeroPointerDown);
heroCanvas.addEventListener("pointermove", onHeroPointerMove);
heroCanvas.addEventListener("pointerup", onHeroPointerUp);
heroCanvas.addEventListener("pointerleave", onHeroPointerUp);
heroCanvas.style.cursor = "grab";

function animateHero() {
  requestAnimationFrame(animateHero);
  if (heroModel && !heroDrag.active) {
    heroModel.rotation.y += 0.004;
  }
  heroRenderer.render(heroScene, heroCamera);
}

resizeHeroCanvas();
animateHero();
//heroRenderer.setAnimationLoop(animateHero);

window.addEventListener("resize", resizeHeroCanvas);
