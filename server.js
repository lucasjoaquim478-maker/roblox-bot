const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let botProcess = null;
let isRunning = false;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch { return null; }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json(cfg || { gameUrl: '', tasks: [], loop: false });
});

app.post('/api/config', (req, res) => {
  saveConfig(req.body);
  res.json({ ok: true });
});

app.get('/api/status', (req, res) => {
  res.json({ running: isRunning });
});

app.post('/api/bot/start', async (req, res) => {
  if (isRunning) return res.status(400).json({ error: 'Bot já está rodando' });

  const config = req.body;
  saveConfig(config);

  if (!config.tasks || config.tasks.length === 0) {
    return res.status(400).json({ error: 'Nenhuma tarefa configurada' });
  }

  const scriptPath = path.join(__dirname, 'bot.ps1');
  const tasksJson = JSON.stringify(config.tasks);
  const loop = config.loop ? '$true' : '$false';

  try {
    botProcess = spawn('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-tasks', tasksJson,
      '-loop', loop
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    botProcess.stdout.on('data', (data) => {
      console.log(`[Bot] ${data.toString().trim()}`);
    });

    botProcess.stderr.on('data', (data) => {
      console.error(`[Bot Error] ${data.toString().trim()}`);
    });

    botProcess.on('close', (code) => {
      console.log(`[Bot] Finalizado (código ${code})`);
      isRunning = false;
      botProcess = null;
    });

    isRunning = true;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bot/stop', (req, res) => {
  if (botProcess) {
    try {
      exec('taskkill /F /T /PID ' + botProcess.pid, () => {});
    } catch {}
    botProcess = null;
  }
  isRunning = false;
  res.json({ ok: true });
});

app.get('/api/mouse-pos', (req, res) => {
  exec('powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $p = [System.Windows.Forms.Cursor]::Position; Write-Output \\\"$($p.X),$($p.Y)\\\""', (err, stdout) => {
    if (err) return res.json({ x: 0, y: 0 });
    const parts = stdout.trim().split(',');
    res.json({ x: parseInt(parts[0]) || 0, y: parseInt(parts[1]) || 0 });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Roblox Bot rodando em http://localhost:${PORT}\n`);
  console.log(`  Abra http://localhost:${PORT} no navegador\n`);
});
