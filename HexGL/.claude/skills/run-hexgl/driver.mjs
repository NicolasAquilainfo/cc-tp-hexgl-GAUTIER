// Pilote HexGL : serveur statique + Chrome/Edge headless (CDP), sans dépendance (Node >= 22).
// Usage : node .claude/skills/run-hexgl/driver.mjs [dossierSortie] [quality 0-3]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const out = path.resolve(process.argv[2] ?? 'formation/tests/captures');
const quality = process.argv[3] ?? '1';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ogg': 'audio/ogg' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = [
  process.env.CHROME_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => p && fs.existsSync(p));
if (!browser) { console.error('Chrome/Edge introuvable (CHROME_BIN possible)'); process.exit(2); }

const server = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(root)) { r.writeHead(403); return r.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  fs.readFile(p, (e, d) => {
    if (e) { r.writeHead(404); return r.end('404'); }
    r.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream' });
    r.end(d);
  });
}).listen(0);
await new Promise(r => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;

fs.mkdirSync(out, { recursive: true });
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'hexgl-shot-'));
const ch = spawn(browser, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${prof}`, '--window-size=1280,720',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });

try {
  let tabs;
  for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); if (tabs.length) break; } catch {} await sleep(500); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let id = 0; const pend = {}; const errors = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) pend[d.id](d);
    else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description ?? ''));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = e => send('Runtime.evaluate', { expression: e, returnByValue: true }).then(r => r.result?.result?.value);
  const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, n), Buffer.from(r.result.data, 'base64')); console.log('OK', path.join(out, n)); };

  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: `${base}/index.html?quality=${quality}` });
  await sleep(3000);
  console.log('webgl', await ev("!!document.createElement('canvas').getContext('webgl')"));
  await shot('01-accueil.png');
  await ev("document.getElementById('start').click()"); await sleep(500);
  await ev("document.getElementById('step-2').click()");
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) { await sleep(1000); ready = await ev("document.getElementById('step-4').style.display==='block'"); }
  if (!ready) throw new Error('chargement du jeu non terminé en 60 s');
  await sleep(9000); // laisse passer le décompte jusqu'à "GO"
  await shot('02-jeu-en-cours.png');
  console.log('erreurs JS:', errors.length ? errors.join('\n') : 'aucune');
} catch (e) { console.error('ERREUR', e); process.exitCode = 1; }
finally { ch.kill(); server.close(); await sleep(1000); /* Windows : Chrome libère le profil avec retard */ try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch {} process.exit(); }
