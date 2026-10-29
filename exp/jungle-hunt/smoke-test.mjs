import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('./', import.meta.url).pathname;
const listeners = {}, elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    style: {setProperty() {}}, classList: {toggle() {}, add() {}}, textContent: '', innerHTML: '', value: 0,
    paused: true, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; },
    setAttribute() {}, addEventListener() {}, getContext() { return new Proxy({}, {get: () => () => {}}); },
  });
  return elements.get(id);
}
globalThis.document = {
  getElementById: element, querySelector: element, body: element('body'),
  addEventListener: (name, fn) => listeners[name] = fn,
  exitPointerLock() {}, pointerLockElement: null,
};
globalThis.window = {addEventListener() {}};
globalThis.innerWidth = 1200; globalThis.innerHeight = 800;
let renderFrame;
globalThis.requestAnimationFrame = fn => renderFrame = fn;
let source = await readFile(root + 'game.js', 'utf8');
source = source.replace("'./vendor/three.module.js'", JSON.stringify('file://' + root + 'vendor/three.module.js'))
  .replace('new T.WebGLRenderer({canvas, antialias: false})', 'new FakeRenderer()')
  .replace('new T.TextureLoader()', '({load: () => new T.Texture()})');
source = `class FakeRenderer {setPixelRatio(){} setSize(){} render(s,c){s.updateMatrixWorld(); c.updateMatrixWorld();}}\n` + source + `
export {enter,pause,collect,reload,fire,camera,scene,animals,enemies,supplies,transmitters,colliders,hurt,bullets};
export function state(){return {active,kills,signals,score,ammo,reserve,hp,boots,scope,ended}};
export function ready(){shot=0};`;
const game = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
let now = performance.now();
function tick(seconds) { for (let i = 0; i < Math.ceil(seconds / .025); i++) { now += 25; renderFrame(now); } }
function key(code, down = true) { listeners[down ? 'keydown' : 'keyup']({code, preventDefault() {}}); }

game.enter(); assert.equal(element('soundtrack').paused, false);
element('sound').onclick(); assert.equal(element('soundtrack').paused, true);
element('sound').onclick(); assert.equal(element('soundtrack').paused, false);
game.pause(); assert.equal(element('soundtrack').paused, true); assert.equal(game.state().active, false);
game.enter(); assert.equal(game.state().active, true);
game.fire(); assert.equal(game.state().ammo, 11);
game.reload(); tick(1.4); assert.equal(game.state().ammo, 12); assert.equal(game.state().reserve, 71);
// Firing must still work after reload, including keyboard auto fire.
game.ready(); game.fire(); assert.equal(game.state().ammo, 11);
key('Space'); tick(.6); key('Space', false); assert.ok(game.state().ammo < 11);
game.reload(); tick(1.4);
const oldReserve = game.state().reserve;
game.hurt(40);
for (const type of ['ammo', 'boots', 'scope', 'tonic', 'med']) {
  const supply = game.supplies.find(s => s.type === type);
  game.camera.position.copy(supply.group.position); game.collect(); assert.equal(supply.used, true);
}
assert.equal(game.state().reserve, oldReserve + 24);
assert.equal(game.state().hp, 100); assert.equal(game.state().boots, true); assert.equal(game.state().scope, true);
listeners.mousedown({button: 2}); assert.equal(game.camera.fov, 32);
listeners.mouseup({button: 2}); assert.equal(game.camera.fov, 70);
// Real Three.js sprite raycasting in the tree-free starting corridor.
for (const enemy of game.enemies) enemy.group.position.set(85, 0, 85);
const target = game.enemies[0]; target.group.position.set(0, 0, -8);
game.camera.position.set(0, 1, -2); game.camera.rotation.set(0, 0, 0);
game.ready(); game.fire(); assert.equal(target.alive, false); assert.equal(game.state().kills, 1);
assert.ok(game.state().score >= 250);
// A live patrol sends dodgeable bullets, and a close projectile damages the player.
const attacker = game.enemies[1]; attacker.group.position.set(0, 0, -10); attacker.cooldown = 0;
game.camera.position.set(0, 1.7, -2); tick(.1); assert.ok(game.bullets.length > 0);
const bullet = game.bullets[0]; bullet.object.position.copy(game.camera.position); bullet.velocity.set(0, 0, 0);
const beforeDamage = game.state().hp; tick(.05); assert.ok(game.state().hp < beforeDamage);
// Wildlife remains available to hunt; it does not count as a mission signal.
const animal = game.animals[0]; animal.group.position.set(0, 0, -6);
attacker.group.position.set(85, 0, 85); game.camera.position.set(0, .85, -2); game.camera.rotation.set(0, 0, 0);
game.ready(); game.fire(); assert.equal(animal.alive, false); assert.equal(game.state().signals, 0);
for (const transmitter of game.transmitters) {
  game.camera.position.copy(transmitter.group.position); game.camera.position.y = 1.7;
  game.collect(); assert.equal(transmitter.disabled, true); assert.equal(transmitter.beam.visible, false);
}
assert.equal(game.state().signals, 3); assert.equal(game.state().ended, false);
game.camera.position.set(0, 1.7, 1); tick(.1);
assert.equal(game.state().ended, true); assert.equal(element('soundtrack').paused, true);
assert.match(element('h1').innerHTML, /COMPLETE/);
// A fresh run also verifies the defeat branch independently of extraction.
const loss = await import('data:text/javascript;base64,' + Buffer.from(source + '\n// defeat scenario').toString('base64'));
loss.enter(); loss.hurt(100); tick(.05);
assert.equal(loss.state().ended, true); assert.equal(element('soundtrack').paused, true);
assert.match(element('h1').innerHTML, /OVER/);
console.log('PASS: soundtrack, pause/resume, firing/reload, keyboard auto fire, supplies/healing, zoom, enemy and wildlife ray hits, patrol projectiles/damage, three transmitters, extraction and defeat.');
