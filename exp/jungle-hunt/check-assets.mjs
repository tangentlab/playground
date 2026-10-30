// Check working files, the staged index, or the exact committed Pages assets.
import {readFile, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('./', import.meta.url));
const repo = path.resolve(root, '../..');
const mode = process.argv[2];
if (mode && !['--staged', '--committed'].includes(mode)) throw new Error('Use --staged or --committed, or no argument for working files.');
const names = (await readdir(path.join(root, 'assets'))).filter(name => /\.(png|ttf|mp3)$/.test(name)).map(name => 'assets/' + name);
names.push('screenshot.png');
for (const name of names) {
  const relative = 'exp/jungle-hunt/' + name;
  const data = mode
    ? execFileSync('git', ['show', (mode === '--staged' ? ':' : 'HEAD:') + relative], {cwd: repo, maxBuffer: 20 * 1024 * 1024})
    : await readFile(path.join(root, name));
  if (data.subarray(0, 80).toString().includes('git-lfs.github.com/spec/v1')) throw new Error(`${relative} is an LFS pointer. Restore the actual file before publishing.`);
  const png = name.endsWith('.png') && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const font = name.endsWith('.ttf') && data.subarray(0, 4).equals(Buffer.from([0,1,0,0]));
  const mp3 = name.endsWith('.mp3') && data.length > 100000 && (data.subarray(0, 3).toString() === 'ID3' || (data[0] === 255 && (data[1] & 224) === 224));
  // The browser screenshot API may return JPEG bytes for the existing preview.
  const preview = name === 'screenshot.png' && data.subarray(0, 3).equals(Buffer.from([255,216,255]));
  if (!png && !font && !mp3 && !preview) throw new Error(`${relative} has an invalid asset signature.`);
}
console.log(`PASS: ${names.length} ${mode || 'working'} browser assets contain actual media, not LFS pointers.`);
