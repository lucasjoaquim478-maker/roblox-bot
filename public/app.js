const App = {
  tasks: [],
  config: { gameUrl: '', tasks: [], loop: false, loginUser: '', loginPass: '' },
  isRunning: false,
  mousePos: { x: 0, y: 0 },

  elements: {},

  taskIcons: {
    click: '🖱️', move: '📍', key: '⌨️',
    wait: '⏳', type: '📝', scroll: '📜',
    focus: '🎯', open: '🌐',
  },

  taskLabels: {
    click: 'Click em', move: 'Mover para',
    key: 'Tecla', wait: 'Esperar',
    type: 'Digitar', scroll: 'Scroll',
    focus: 'Focar janela', open: 'Abrir URL',
  },

  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadConfig();
    this.pollStatus();
  },

  cacheElements() {
    this.elements = {
      gameUrl: document.querySelector('#gameUrl'),
      taskList: document.querySelector('#taskList'),
      loopToggle: document.querySelector('#loopToggle'),
      btnStart: document.querySelector('#btnStart'),
      btnStop: document.querySelector('#btnStop'),
      btnSave: document.querySelector('#btnSave'),
      btnAddTask: document.querySelector('#btnAddTask'),
      btnClearTasks: document.querySelector('#btnClearTasks'),
      btnClearLog: document.querySelector('#btnClearLog'),
      btnGetPos: document.querySelector('#btnGetPos'),
      btnOpenGame: document.querySelector('#btnOpenGame'),
      btnLogin: document.querySelector('#btnLogin'),
      loginUser: document.querySelector('#loginUser'),
      loginPass: document.querySelector('#loginPass'),
      statusDot: document.querySelector('#statusDot'),
      statusText: document.querySelector('#statusText'),
      logOutput: document.querySelector('#logOutput'),
    };
  },

  bindEvents() {
    const el = this.elements;

    document.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', () => this.addTaskDialog(btn.dataset.type));
    });

    el.btnAddTask.addEventListener('click', () => this.addTaskDialog('click'));
    el.btnClearTasks.addEventListener('click', () => { this.clearTasks(); });
    el.btnStart.addEventListener('click', () => this.startBot());
    el.btnStop.addEventListener('click', () => this.stopBot());
    el.btnSave.addEventListener('click', () => this.saveConfig());
    el.btnClearLog.addEventListener('click', () => { el.logOutput.textContent = 'Log limpo.'; });
    el.btnOpenGame.addEventListener('click', () => {
      const url = el.gameUrl.value.trim();
      if (url) window.open(url, '_blank');
    });
    el.btnLogin.addEventListener('click', () => this.doLogin());
    el.btnGetPos.addEventListener('click', () => this.getMousePosition());
  },

  async doLogin() {
    const user = this.elements.loginUser.value.trim();
    const pass = this.elements.loginPass.value.trim();
    if (!user || !pass) { this.log('⚠️ Preencha usuário e senha primeiro'); return; }

    this.log('🤖 Iniciando login automático...');
    this.elements.btnLogin.disabled = true;

    const loginTasks = [
      { type: 'open', url: 'https://www.roblox.com/login' },
      { type: 'wait', ms: 5000 },
      { type: 'login', user, pass },
    ];

    try {
      const resp = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: loginTasks, loop: false }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        this.log(`❌ ${err.error}`);
      } else {
        this.isRunning = true;
        this.updateUI();
      }
    } catch (e) {
      this.log(`❌ Erro: ${e.message}`);
    }

    setTimeout(() => { this.elements.btnLogin.disabled = false; }, 10000);
  },

  getMousePosition() {
    fetch('/api/mouse-pos')
      .then(r => r.json())
      .then(d => { this.mousePos = d; this.log(`Posição: (${d.x}, ${d.y})`); })
      .catch(() => this.log('Clique em qualquer lugar do Roblox'));
  },

  addTaskDialog(type) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = this.getTaskModalHtml(type);
    document.body.appendChild(overlay);

    overlay.querySelector('.btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector('.modal').addEventListener('click', e => e.stopPropagation());
    overlay.addEventListener('click', () => overlay.remove());

    const form = overlay.querySelector('.modal');
    form.querySelector('.btn-confirm').onclick = () => {
      const data = { type };
      const inputs = form.querySelectorAll('[data-field]');
      inputs.forEach(inp => { data[inp.dataset.field] = inp.value; });
      data.x = parseInt(data.x) || 0;
      data.y = parseInt(data.y) || 0;
      data.ms = parseInt(data.ms) || 1000;
      data.amount = parseInt(data.amount) || 1;

      this.tasks.push(data);
      this.renderTasks();
      this.log(`Tarefa: ${this.taskLabels[type] || type}`);
      overlay.remove();
    };
  },

  getTaskModalHtml(type) {
    const common = `<div class="modal-actions">
        <button class="btn btn-secondary btn-cancel">Cancelar</button>
        <button class="btn btn-primary btn-confirm">Adicionar</button>
      </div>`;

    const fields = {
      click: `<h3>🖱️ Click</h3>
        <div class="form-group"><label>X</label><input data-field="x" type="number" value="${this.mousePos.x}"></div>
        <div class="form-group"><label>Y</label><input data-field="y" type="number" value="${this.mousePos.y}"></div>`,
      move: `<h3>📍 Mover Mouse</h3>
        <div class="form-group"><label>X</label><input data-field="x" type="number" value="${this.mousePos.x}"></div>
        <div class="form-group"><label>Y</label><input data-field="y" type="number" value="${this.mousePos.y}"></div>`,
      key: `<h3>⌨️ Tecla</h3>
        <div class="form-group"><label>Tecla</label><select data-field="key">
          <option value="enter">Enter</option><option value="space">Space</option><option value="tab">Tab</option>
          <option value="escape">Esc</option><option value="up">↑ Seta Cima</option>
          <option value="down">↓ Seta Baixo</option><option value="left">← Esquerda</option>
          <option value="right">→ Direita</option><option value="e">E</option><option value="q">Q</option>
          <option value="w">W</option><option value="r">R</option><option value="f">F</option>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select></div>`,
      wait: `<h3>⏳ Esperar</h3>
        <div class="form-group"><label>Tempo (ms)</label><input data-field="ms" type="number" value="1000" min="100" step="100"></div>`,
      type: `<h3>📝 Digitar</h3>
        <div class="form-group"><label>Texto</label><input data-field="text" type="text" placeholder="Texto..."></div>`,
      scroll: `<h3>📜 Scroll</h3>
        <div class="form-group"><label>Quantidade (+ baixo, - cima)</label><input data-field="amount" type="number" value="3"></div>`,
      focus: `<h3>🎯 Focar Janela</h3><p style="color:var(--text-secondary);font-size:13px">Ativa a janela do Roblox.</p>`,
      open: `<h3>🌐 Abrir URL</h3>
        <div class="form-group"><label>URL</label><input data-field="url" type="text" placeholder="https://..."></div>`,
    };

    return `<div class="modal">${fields[type] || fields.click}${common}</div>`;
  },

  renderTasks() {
    const el = this.elements.taskList;
    if (this.tasks.length === 0) {
      el.innerHTML = '<div class="empty">Nenhuma tarefa.</div>';
      return;
    }

    let html = '';
    this.tasks.forEach((t, i) => {
      const icon = this.taskIcons[t.type] || '📋';
      let label = '';

      switch (t.type) {
        case 'click':  label = `Click em <span class="highlight">(${t.x}, ${t.y})</span>`; break;
        case 'move':   label = `Mover para <span class="highlight">(${t.x}, ${t.y})</span>`; break;
        case 'key':    label = `Pressionar <span class="highlight">${t.key}</span>`; break;
        case 'wait':   label = `Aguardar <span class="highlight">${t.ms}ms</span>`; break;
        case 'type':   label = `Digitar <span class="highlight">"${t.text}"</span>`; break;
        case 'scroll': label = `Scroll <span class="highlight">${t.amount}</span>`; break;
        case 'focus':  label = `Focar janela Roblox`; break;
        case 'open':   label = `Abrir <span class="highlight">${t.url}</span>`; break;
        default: label = t.type;
      }

      html += `<div class="task-item">
        <span class="task-icon">${icon}</span>
        <span class="task-label">${i + 1}. ${label}</span>
        <span class="task-del" data-idx="${i}">✕</span>
      </div>`;
    });

    el.innerHTML = html;
    el.querySelectorAll('.task-del').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tasks.splice(parseInt(btn.dataset.idx), 1);
        this.renderTasks();
      });
    });
  },

  clearTasks() { this.tasks = []; this.renderTasks(); this.log('Tarefas removidas'); },

  async startBot() {
    if (this.isRunning) return;

    const config = {
      gameUrl: this.elements.gameUrl.value.trim(),
      tasks: this.tasks,
      loop: this.elements.loopToggle.checked,
      loginUser: this.elements.loginUser.value.trim(),
      loginPass: this.elements.loginPass.value.trim(),
    };

    if (config.tasks.length === 0) { this.log('⚠️ Adicione tarefas primeiro'); return; }

    try {
      const resp = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!resp.ok) { const err = await resp.json(); this.log(`❌ ${err.error}`); return; }
      this.isRunning = true;
      this.updateUI();
      this.log('🤖 Bot iniciado!');
    } catch (e) { this.log(`❌ Erro: ${e.message}`); }
  },

  async stopBot() {
    try { await fetch('/api/bot/stop', { method: 'POST' }); } catch {}
    this.isRunning = false;
    this.updateUI();
    this.log('⏹️ Bot parado');
  },

  async saveConfig() {
    const config = {
      gameUrl: this.elements.gameUrl.value.trim(),
      tasks: this.tasks,
      loop: this.elements.loopToggle.checked,
      loginUser: this.elements.loginUser.value.trim(),
      loginPass: this.elements.loginPass.value.trim(),
    };
    try {
      const resp = await fetch('/api/config', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      if (resp.ok) this.log('💾 Configuração salva!');
    } catch (e) { this.log(`❌ Erro: ${e.message}`); }
  },

  async loadConfig() {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const cfg = await resp.json();
        if (cfg) {
          this.config = cfg;
          this.elements.gameUrl.value = cfg.gameUrl || '';
          this.tasks = cfg.tasks || [];
          this.elements.loopToggle.checked = cfg.loop || false;
          this.elements.loginUser.value = cfg.loginUser || '';
          this.elements.loginPass.value = cfg.loginPass || '';
          this.renderTasks();
        }
      }
    } catch {}
  },

  async pollStatus() {
    setInterval(async () => {
      try {
        const resp = await fetch('/api/status');
        if (resp.ok) {
          const data = await resp.json();
          if (data.running !== this.isRunning) {
            this.isRunning = data.running;
            this.updateUI();
            if (!this.isRunning) this.log('Bot finalizado');
          }
        }
      } catch {}
    }, 2000);
  },

  updateUI() {
    const el = this.elements;
    el.btnStart.disabled = this.isRunning;
    el.btnStop.disabled = !this.isRunning;
    el.statusDot.className = 'status-dot ' + (this.isRunning ? 'running' : 'stopped');
    el.statusText.textContent = this.isRunning ? 'Rodando' : 'Parado';
  },

  log(msg) {
    const el = this.elements.logOutput;
    const time = new Date().toLocaleTimeString();
    el.textContent += `\n[${time}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
