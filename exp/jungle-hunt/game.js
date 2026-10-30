import * as T from './vendor/three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
const renderer = new T.WebGLRenderer({canvas, antialias: false});
renderer.setPixelRatio(1);
const scene = new T.Scene();
scene.background = new T.Color('#142e39');
scene.fog = new T.FogExp2('#142e39', .022);
const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, .1, 160);
camera.rotation.order = 'YXZ';
scene.add(camera);
scene.add(new T.HemisphereLight('#b9d78a', '#163d42', 2));
const moonlight = new T.DirectionalLight('#9fc9b2', 1.4);
moonlight.position.set(-25, 40, -30);
scene.add(moonlight);

let seed = 1987;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a, b) => a + random() * (b - a);
const material = color => new T.MeshLambertMaterial({color, flatShading: true});
const loader = new T.TextureLoader();
function texture(name, repeat = 1) {
  const tex = loader.load(`assets/${name}.png?v=assets-2`);
  tex.magFilter = tex.minFilter = T.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = T.SRGBColorSpace;
  if (repeat !== 1) {
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}
function mesh(geometry, mat, parent = scene, x = 0, y = 0, z = 0) {
  const object = new T.Mesh(geometry, mat);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
function box(w, h, d, mat, parent, x, y, z) {
  return mesh(new T.BoxGeometry(w, h, d), mat, parent, x, y, z);
}
const palette = {
  bark: new T.MeshLambertMaterial({map: texture('bark'), color: '#a8a875'}),
  leaves: ['#214b3c', '#356346', '#4b7b48', '#6c9855'].map(material),
  stone: material('#4b6963'), edge: material('#779473'), dark: material('#203c40'),
};
mesh(new T.PlaneGeometry(220, 220), new T.MeshLambertMaterial({map: texture('ground', 42)})).rotation.x = -Math.PI / 2;
const moon = mesh(new T.CircleGeometry(7, 16), new T.MeshBasicMaterial({color: '#bcd7ab'}), scene, -48, 35, -95);
moon.lookAt(0, 15, 0);
const colliders = [];
const obstructionMeshes = [];
function obstacle(object, x, z, radius) {
  colliders.push({x, z, radius});
  obstructionMeshes.push(object);
}

// Chunky canopy layers, pixel-textured trunks and hanging vines.
for (let i = 0; i < 190; i++) {
  const x = range(-98, 98), z = range(-98, 98);
  if (Math.hypot(x, z) < 10 || (Math.abs(x) < 4 && z < 15 && z > -32)) continue;
  const height = range(10, 18), radius = range(.4, .75);
  const trunk = mesh(new T.CylinderGeometry(radius * .65, radius, height, 5), palette.bark, scene, x, height / 2, z);
  obstacle(trunk, x, z, radius);
  for (let j = 0; j < 3; j++) {
    const crown = mesh(new T.IcosahedronGeometry(range(3, 5.6), 0), palette.leaves[(i + j) % 4], scene,
      x + range(-1.5, 1.5), height - 1 + j * 1.6, z + range(-1.5, 1.5));
    crown.scale.y = .55;
  }
  if (i % 3 === 0) {
    const vine = box(.10, height * .65, .10, palette.leaves[2], scene, x + 2, height * .6, z);
    vine.rotation.z = .08;
  }
}
const fernMaterial = new T.SpriteMaterial({map: texture('fern'), alphaTest: .4, transparent: true});
for (let i = 0; i < 430; i++) {
  const x = range(-98, 98), z = range(-98, 98);
  if (Math.hypot(x, z) < 6 || (Math.abs(x) < 2 && z > -30 && z < 0)) continue;
  const fern = new T.Sprite(fernMaterial);
  const size = range(.8, 2.3);
  fern.position.set(x, size / 2, z);
  fern.scale.set(size, size, 1);
  scene.add(fern);
}
for (let i = 0; i < 42; i++) {
  const rock = mesh(new T.DodecahedronGeometry(range(.5, 1.5), 0), palette.stone, scene, range(-95, 95), .3, range(-95, 95));
  rock.scale.y = .55;
}
const water = mesh(new T.PlaneGeometry(10, 210), new T.MeshBasicMaterial({color: '#285968'}), scene, 35, .025, 0);
water.rotation.x = -Math.PI / 2;
for (let i = 0; i < 50; i++) {
  const glint = mesh(new T.PlaneGeometry(range(.4, 2), .12), new T.MeshBasicMaterial({color: '#538480'}), scene, range(31, 39), .035, range(-95, 95));
  glint.rotation.x = -Math.PI / 2;
}

function ruin(x, z) {
  for (const side of [-1, 1]) {
    const pillar = box(1.2, 4.5, 1.2, palette.stone, scene, x + side * 3.4, 2.25, z);
    obstacle(pillar, x + side * 3.4, z, .9);
    box(1.5, .5, 1.5, palette.edge, scene, x + side * 3.4, 4.3, z);
    for (let i = 0; i < 3; i++) box(.3, .3, 1.23, palette.leaves[2], scene, x + side * 3.4 - .3, 1 + i, z);
  }
  box(8, 1, 1.4, palette.stone, scene, x, 5.1, z);
  box(7.6, .25, 1.5, palette.edge, scene, x, 5.65, z);
  for (let i = 0; i < 4; i++) box(.2, .25, 1.42, palette.dark, scene, x - 2 + i * 1.3, 5.1, z);
}
ruin(0, -25); ruin(-25, -37); ruin(20, -56);
const camp = new T.Group();
scene.add(camp);
mesh(new T.ConeGeometry(2.8, 2.5, 4), material('#9d9055'), camp, -4, 1.25, 0).rotation.y = Math.PI / 4;
const amber = new T.MeshBasicMaterial({color: '#efba65'});
mesh(new T.CylinderGeometry(.06, .06, 12, 4), amber, camp, 0, 6, 0);
mesh(new T.TorusGeometry(2.7, .07, 4, 16), amber, camp, 0, .08, 0).rotation.x = -Math.PI / 2;

const transmitters = [];
for (const [x, z] of [[0, -30], [-25, -43], [20, -62]]) {
  const group = new T.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  box(1.3, 1.4, .8, palette.dark, group, 0, .7, 0);
  box(1.1, .8, .85, palette.stone, group, 0, 1, 0);
  box(.6, .3, .86, new T.MeshBasicMaterial({color: '#72c4ac'}), group, -.1, 1.15, 0);
  box(.06, 3, .06, palette.edge, group, .4, 2.4, 0);
  box(1.4, .07, .07, palette.edge, group, .4, 3.5, 0);
  const beam = mesh(new T.CylinderGeometry(.04, .04, 13, 4), new T.MeshBasicMaterial({color: '#72c4ac', transparent: true, opacity: .6}), group, 0, 7, 0);
  transmitters.push({group, beam, disabled: false});
}

function sprite(group, name, w, h, y) {
  const object = new T.Sprite(new T.SpriteMaterial({map: texture(name), alphaTest: .5, transparent: true}));
  object.scale.set(w, h, 1);
  object.position.y = y;
  group.add(object);
  return object;
}
const animals = [];
for (const [x, z, type] of [[-8, -16, 'deer'], [12, -22, 'boar'], [-18, -28, 'deer'], [20, -40, 'boar'], [-35, 25, 'boar'], [10, 35, 'deer']]) {
  const group = new T.Group();
  group.position.set(x, 0, z); scene.add(group);
  sprite(group, type, 2.2, 1.65, .85);
  animals.push({group, type, alive: true, angle: range(0, 6.28), alarm: 0});
}
const sentryFrames = [texture('sentry-0'), texture('sentry-1')];
const enemies = [];
for (const [x, z] of [[5, -21], [-7, -35], [-22, -32], [-31, -45], [15, -52], [25, -64], [-15, -59], [12, 18]]) {
  const group = new T.Group(); group.position.set(x, 0, z); scene.add(group);
  const body = new T.Sprite(new T.SpriteMaterial({map: sentryFrames[0], alphaTest: .5, transparent: true}));
  body.position.y = 1; body.scale.set(1.5, 2, 1); group.add(body);
  enemies.push({group, body, alive: true, cooldown: range(1.5, 3), origin: new T.Vector3(x, 0, z), phase: range(0, 6.28)});
}
const supplies = [];
const types = {
  ammo: ['#efba65', 'AMMO CACHE +24'], med: ['#e67b65', 'MEDKIT +50 HEALTH'],
  boots: ['#72c4ac', 'TRAIL BOOTS: SPEED UP'], scope: ['#b5a3da', 'SCOPE: RIGHT CLICK TO ZOOM'],
  tonic: ['#c7dd75', 'POWER RESTORED'],
};
for (const [x, z, type] of [[2, -5, 'ammo'], [-3, -9, 'boots'], [7, -14, 'scope'], [-9, -21, 'med'], [15, -30, 'ammo'], [-20, -10, 'tonic'], [-32, -30, 'ammo'], [25, 7, 'med'], [-15, 20, 'ammo'], [7, 26, 'tonic'], [-22, -42, 'med'], [17, -59, 'ammo']]) {
  const group = new T.Group(); group.position.set(x, .6, z); scene.add(group);
  const color = new T.MeshBasicMaterial({color: types[type][0]});
  box(.65, .55, .5, palette.dark, group, 0, 0, 0);
  box(.4, .13, .52, color, group, 0, 0, 0);
  box(.13, .4, .52, color, group, 0, 0, 0);
  mesh(new T.TorusGeometry(.55, .03, 4, 12), color, group).rotation.x = -Math.PI / 2;
  supplies.push({group, type, used: false});
}

const MAGAZINE = 12;
let active = false, ended = false, kills = 0, signals = 0, score = 0;
let hp = 100, stamina = 100, ammo = MAGAZINE, reserve = 72;
let boots = false, scope = false, reloading = 0, shot = 0, yaw = 0, pitch = 0;
let time = 0, noticeTime = 0, damageFlash = 0, fireHeld = false;
let audioOn = true, audioCtx;
const keys = new Set();
const bullets = [];
const ray = new T.Raycaster();
const direction = new T.Vector3();
camera.position.set(0, 1.7, 5);
const soundtrack = $('soundtrack');
soundtrack.volume = .45;

function notice(message, duration = 3) { $('notice').textContent = message; noticeTime = duration; }
function tone(frequency, duration = .1, type = 'square') {
  if (!audioOn || typeof AudioContext === 'undefined') return;
  audioCtx ??= new AudioContext();
  const oscillator = audioCtx.createOscillator(), gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency / 4), audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(.035, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start(); oscillator.stop(audioCtx.currentTime + duration);
}
function playMusic() {
  if (audioOn) soundtrack.play().catch(error => {
    if (error.name !== 'AbortError') notice('AUDIO OFFLINE / TOGGLE SOUND TO RETRY');
  });
}
$('sound').onclick = () => {
  audioOn = !audioOn;
  $('sound').textContent = audioOn ? '♪ SOUND ON' : '♪ SOUND OFF';
  $('sound').setAttribute('aria-pressed', String(audioOn));
  if (audioOn && active) playMusic(); else soundtrack.pause();
};
function enter() {
  active = true; keys.clear(); fireHeld = false; playMusic();
  $('overlay').style.display = 'none'; $('hud').style.display = 'block';
}
function pause() {
  active = false; keys.clear(); fireHeld = false; soundtrack.pause();
  camera.fov = 70; camera.updateProjectionMatrix();
  $('overlay').style.display = 'flex'; $('hud').style.display = 'none';
  $('start').textContent = '▶ RESUME MISSION';
}
$('start').onclick = async () => {
  if (ended) { location.reload(); return; }
  playMusic();
  try { await canvas.requestPointerLock(); }
  catch { enter(); notice('ARROW KEYS TO AIM / ESC TO PAUSE'); }
};
document.addEventListener('pointerlockchange', () => {
  if (ended) return;
  if (document.pointerLockElement === canvas) enter(); else pause();
});
document.addEventListener('mousemove', event => {
  if (!active || document.pointerLockElement !== canvas) return;
  yaw -= event.movementX * .0024;
  pitch = T.MathUtils.clamp(pitch - event.movementY * .0024, -.9, .9);
});
document.addEventListener('keydown', event => {
  if (!active) return;
  if (event.code === 'Escape') {
    pause(); if (document.pointerLockElement) document.exitPointerLock(); return;
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'KeyR') reload();
  if (event.code === 'KeyE' && !event.repeat) collect();
});
document.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { if (active) pause(); });
canvas.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('mousedown', event => {
  if (!active || event.target?.closest?.('header')) return;
  if (event.button === 2 && scope) { camera.fov = 32; camera.updateProjectionMatrix(); return; }
  if (event.button === 0) { fireHeld = true; fire(); }
});
document.addEventListener('mouseup', event => {
  if (event.button === 0) fireHeld = false;
  if (event.button === 2) { camera.fov = 70; camera.updateProjectionMatrix(); }
});
function reload() {
  if (reloading || ammo === MAGAZINE || reserve === 0) return;
  reloading = 1.25; notice('RELOADING...', 1.25);
}
function collect() {
  const transmitter = transmitters.find(t => !t.disabled && t.group.position.distanceTo(camera.position) < 3.2);
  if (transmitter) {
    transmitter.disabled = true; transmitter.beam.visible = false;
    transmitter.group.children[2].material.color.set('#e67b65');
    signals++; score += 500; tone(650, .3);
    notice(signals === 3 ? 'ALL SIGNALS SILENT / RETURN TO EXTRACTION' : `SIGNAL ${signals}/3 SILENCED / +500`);
    return;
  }
  const supply = supplies.find(s => !s.used && s.group.position.distanceTo(camera.position) < 3);
  if (!supply) { notice('NO CONTACT / MOVE CLOSER TO A CACHE OR RADIO'); return; }
  supply.used = true; supply.group.visible = false; score += 50;
  if (supply.type === 'ammo') reserve += 24;
  if (supply.type === 'med') hp = Math.min(100, hp + 50);
  if (supply.type === 'tonic') stamina = 100;
  if (supply.type === 'boots') boots = true;
  if (supply.type === 'scope') scope = true;
  notice(types[supply.type][1]); tone(850, .15);
}
function visibleInScene(object) {
  for (let parent = object; parent; parent = parent.parent) if (!parent.visible) return false;
  return true;
}
function fire() {
  if (shot > 0 || reloading) return;
  if (!ammo) { if (reserve) reload(); else notice('OUT OF AMMO / FIND A CACHE'); return; }
  ammo--; shot = .23; tone(100, .12, 'sawtooth');
  scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  ray.setFromCamera(new T.Vector2(), camera);
  const hits = ray.intersectObjects([...obstructionMeshes, ...enemies.filter(e => e.alive).map(e => e.group), ...animals.filter(a => a.alive).map(a => a.group)], true);
  const hit = hits.find(h => h.distance < 75 && visibleInScene(h.object));
  if (hit) {
    const enemy = enemies.find(e => e.alive && e.group.getObjectById(hit.object.id));
    const animal = animals.find(a => a.alive && a.group.getObjectById(hit.object.id));
    const target = enemy || animal;
    if (target) {
      target.alive = false; target.group.visible = false; kills++;
      score += enemy ? 250 : 100;
      notice(enemy ? 'PATROL DOWN / +250' : 'WILDLIFE TRACKED / +100', 1.2);
    }
  }
  for (const animal of animals) if (animal.alive && animal.group.position.distanceTo(camera.position) < 28) animal.alarm = 5;
}
function hurt(damage) {
  hp = Math.max(0, hp - damage); damageFlash = .16;
}
function finish(won) {
  ended = true; active = false; fireHeld = false; soundtrack.pause(); keys.clear();
  if (document.pointerLockElement) document.exitPointerLock();
  $('overlay').style.display = 'flex'; $('hud').style.display = 'none';
  document.body.classList.add('ended');
  document.querySelector('.eyebrow').textContent = won ? 'ALL SIGNALS SILENT' : 'OPERATIVE MISSING';
  document.querySelector('h1').innerHTML = won ? 'MISSION<span>COMPLETE</span>' : 'GAME<span>OVER</span>';
  document.querySelector('.tagline').textContent = `SCORE ${String(score).padStart(6, '0')} / SIGNALS ${signals}/3 / ${Math.floor(time)} SEC`;
  document.querySelector('.briefing').innerHTML = won
    ? '<div class="brief-title">[ FINAL TRANSMISSION ]</div><p>Extraction confirmed.<br>The jungle has gone quiet.</p><p class="warning">FOR NOW.</p>'
    : '<div class="brief-title">[ SIGNAL LOST ]</div><p>Last known location:<br>SECTOR 07.</p><p class="warning">TRY AGAIN, COMMANDO.</p>';
  $('start').textContent = '▶ PLAY AGAIN';
}
function canMove(x, z) {
  return Math.abs(x) < 96 && Math.abs(z) < 96 && !colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.radius + .4);
}
const sightRay = new T.Raycaster();
function lineOfSight(from, to) {
  const distance = from.distanceTo(to);
  sightRay.set(from, direction.copy(to).sub(from).normalize());
  sightRay.far = distance;
  return !sightRay.intersectObjects(obstructionMeshes, false).length;
}
const bulletGeometry = new T.BoxGeometry(.12, .12, .35);
const bulletMaterial = new T.MeshBasicMaterial({color: '#ff9478'});
function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const position = enemy.group.position;
    const distance = position.distanceTo(camera.position);
    const dx = camera.position.x - position.x, dz = camera.position.z - position.z;
    if (distance < 30 && distance > 9) {
      const speed = dt * 1.5 / distance;
      const x = position.x + dx * speed, z = position.z + dz * speed;
      if (canMove(x, z)) position.set(x, 0, z);
    } else if (distance >= 30) {
      const x = enemy.origin.x + Math.sin(time * .4 + enemy.phase) * 2;
      const z = enemy.origin.z + Math.cos(time * .4 + enemy.phase) * 2;
      if (canMove(x, z)) position.set(x, 0, z);
    }
    enemy.body.material.map = sentryFrames[Math.floor(time * 5 + enemy.phase) % 2];
    enemy.cooldown -= dt;
    if (distance < 29 && enemy.cooldown <= 0) {
      const origin = position.clone(); origin.y = 1.3;
      if (lineOfSight(origin, camera.position)) {
        const object = mesh(bulletGeometry, bulletMaterial);
        object.position.copy(origin);
        const velocity = camera.position.clone().sub(origin).normalize().multiplyScalar(12);
        object.lookAt(camera.position);
        bullets.push({object, velocity, life: 3});
      }
      enemy.cooldown = 1.8 + random();
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i]; bullet.life -= dt;
    const step = bullet.velocity.clone().multiplyScalar(dt);
    sightRay.set(bullet.object.position, direction.copy(step).normalize()); sightRay.far = step.length();
    const blocked = sightRay.intersectObjects(obstructionMeshes, false).length > 0;
    bullet.object.position.add(step);
    const hit = bullet.object.position.distanceTo(camera.position) < .65;
    if (hit) { hurt(12); tone(45, .08); }
    if (hit || blocked || bullet.life <= 0) { scene.remove(bullet.object); bullets.splice(i, 1); }
  }
}
function updateAnimals(dt) {
  for (const animal of animals) {
    if (!animal.alive) continue;
    const position = animal.group.position, distance = position.distanceTo(camera.position);
    animal.alarm = Math.max(0, animal.alarm - dt);
    if (distance < 12 || animal.alarm > 0) animal.angle = Math.atan2(position.x - camera.position.x, position.z - camera.position.z);
    else if (random() < .01) animal.angle += range(-.4, .4);
    const speed = distance < 12 || animal.alarm > 0 ? 3 : .5;
    position.x = T.MathUtils.clamp(position.x + Math.sin(animal.angle) * dt * speed, -92, 92);
    position.z = T.MathUtils.clamp(position.z + Math.cos(animal.angle) * dt * speed, -92, 92);
    position.y = Math.abs(Math.sin(time * speed * 4)) * .07;
    if (animal.type === 'boar' && distance < 2.6) hurt(14 * dt);
  }
}
const map = $('map').getContext('2d');
function drawMap() {
  map.fillStyle = '#142e32'; map.fillRect(0, 0, 128, 128);
  map.strokeStyle = '#33574d';
  for (let i = 0; i < 128; i += 16) {
    map.beginPath(); map.moveTo(i, 0); map.lineTo(i, 128); map.moveTo(0, i); map.lineTo(128, i); map.stroke();
  }
  const dot = (position, color, size) => {
    const x = Math.round(64 + (position.x - camera.position.x) * 1.5);
    const y = Math.round(64 + (position.z - camera.position.z) * 1.5);
    if (x < 3 || x > 125 || y < 3 || y > 125) return;
    map.fillStyle = color; map.fillRect(x - size / 2, y - size / 2, size, size);
  };
  dot(camp.position, '#efba65', 6);
  for (const t of transmitters) if (!t.disabled) dot(t.group.position, '#72c4ac', 5);
  for (const s of supplies) if (!s.used) dot(s.group.position, types[s.type][0], 3);
  for (const e of enemies) if (e.alive) dot(e.group.position, '#e67b65', 4);
  for (const a of animals) if (a.alive) dot(a.group.position, '#a69b69', 2);
  map.save(); map.translate(64, 64); map.rotate(-yaw); map.fillStyle = '#e8dfad';
  map.beginPath(); map.moveTo(0, -5); map.lineTo(-3, 4); map.lineTo(3, 4); map.fill(); map.restore();
}
function updateHUD() {
  $('hp').textContent = Math.ceil(hp);
  $('health').value = hp; $('stamina').value = stamina;
  $('ammo').textContent = String(ammo).padStart(2, '0'); $('reserve').textContent = reserve;
  $('count').textContent = `${signals} / 3`; $('score').textContent = String(score).padStart(6, '0');
  $('gear').innerHTML = `${boots ? 'TRAIL BOOTS' : 'STANDARD BOOTS'}<br>${scope ? 'SCOPE EQUIPPED' : 'IRON SIGHTS'}`;
  const target = signals === 3 ? camp : transmitters.filter(t => !t.disabled).sort((a, b) => a.group.position.distanceTo(camera.position) - b.group.position.distanceTo(camera.position))[0]?.group;
  if (target) $('objective').textContent = `${signals === 3 ? 'EXTRACTION' : 'SIGNAL'}: ${Math.round(target.position.distanceTo(camera.position))}M / ${signals === 3 ? 'REACH THE BEACON' : 'E TO INTERACT'}`;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  $('compass').textContent = `· ${directions[(Math.round(-yaw / (Math.PI / 4)) % 8 + 8) % 8]} ·`;
  $('weapon').style.setProperty('--recoil', `${shot > .1 ? 14 : 0}px`);
  $('weapon').classList.toggle('firing', shot > .17);
  document.body.classList.toggle('hit', damageFlash > 0);
  drawMap();
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (active) {
    time += dt; shot = Math.max(0, shot - dt); damageFlash = Math.max(0, damageFlash - dt);
    noticeTime -= dt;
    if (noticeTime <= 0) $('notice').textContent = '';
    if (reloading > 0) {
      reloading -= dt;
      if (reloading <= 0) {
        reloading = 0;
        const rounds = Math.min(MAGAZINE - ammo, reserve); ammo += rounds; reserve -= rounds;
      }
    }
    let dx = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    let dz = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
    const moving = dx !== 0 || dz !== 0;
    const sprint = moving && (keys.has('ShiftLeft') || keys.has('ShiftRight')) && stamina > 1;
    stamina = T.MathUtils.clamp(stamina + (sprint ? -23 : 15) * dt, 0, 100);
    if (moving) {
      const length = Math.hypot(dx, dz), speed = (boots ? 6 : 4.8) * (sprint ? 1.65 : 1);
      dx /= length; dz /= length;
      const x = camera.position.x + (dx * Math.cos(yaw) + dz * Math.sin(yaw)) * speed * dt;
      const z = camera.position.z + (-dx * Math.sin(yaw) + dz * Math.cos(yaw)) * speed * dt;
      // Axis-separated collision lets the player slide along trunks and ruins.
      if (canMove(x, camera.position.z)) camera.position.x = x;
      if (canMove(camera.position.x, z)) camera.position.z = z;
    }
    yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'))) * dt * 1.7;
    pitch = T.MathUtils.clamp(pitch + (Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'))) * dt, -.9, .9);
    camera.position.y = 1.7 + (moving ? Math.sin(time * (sprint ? 13 : 9)) * .04 : 0);
    camera.rotation.set(pitch, yaw, 0);
    if (fireHeld || keys.has('Space')) fire();
    scene.updateMatrixWorld(true);
    updateEnemies(dt); updateAnimals(dt);
    for (const s of supplies) if (!s.used) {
      s.group.position.y = .65 + Math.sin(time * 3) * .1;
      s.group.rotation.y += dt;
      if (s.group.position.distanceTo(camera.position) < 2.7 && noticeTime <= 0) $('notice').textContent = `E / ${types[s.type][1]}`;
    }
    for (const t of transmitters) if (!t.disabled && t.group.position.distanceTo(camera.position) < 3.2 && noticeTime <= 0) $('notice').textContent = 'E / SILENCE TRANSMITTER';
    if (hp <= 0) finish(false);
    else if (signals === 3 && Math.hypot(camera.position.x, camera.position.z) < 3) finish(true);
    updateHUD();
  } else if (!ended) {
    camera.rotation.set(-.02, yaw + Math.sin(now * .00004) * .05, 0);
  }
  renderer.render(scene, camera);
}
function resize() {
  // Nearest-neighbor scaling of an actual low-resolution framebuffer.
  const scale = Math.max(2, Math.ceil(innerWidth / 480));
  renderer.setSize(Math.ceil(innerWidth / scale), Math.ceil(innerHeight / scale), false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize(); requestAnimationFrame(frame);
