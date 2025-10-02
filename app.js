// ChatHub - client-side app with localStorage-based auth, servers, channels, and messages
// No backend required; works on static hosting

// Elements
const loginScreen = document.getElementById('loginScreen');
const chatApp = document.getElementById('chatApp');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');

const serverList = document.getElementById('serverList');
const addServerBtn = document.getElementById('addServerBtn');
const channelList = document.getElementById('channelList');
const addChannelBtn = document.getElementById('addChannelBtn');

const currentServerName = document.getElementById('currentServerName');
const currentChannelName = document.getElementById('currentChannelName');
const currentUsernameEl = document.getElementById('currentUsername');

const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

const membersSidebar = document.getElementById('membersSidebar');
const toggleMembersBtn = document.getElementById('toggleMembersBtn');
const membersList = document.getElementById('membersList');

// App state
let state = {
  user: null,           // {username}
  servers: [],          // [{id, name, channels:[{id, name}], members:[username]}]
  activeServerId: null,
  activeChannelId: null
};

// Seed demo users
const DEMO_USERS = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' },
  { username: 'user3', password: 'pass3' }
];

// Storage helpers
const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const KEYS = {
  users: 'chathub_users',
  state: 'chathub_state',
  messages: (serverId, channelId) => `chathub_msgs_${serverId}_${channelId}`
};

function loadUsers() {
  let users = storage.get(KEYS.users, null);
  if (!users) {
    users = DEMO_USERS;
    storage.set(KEYS.users, users);
  }
  return users;
}

function saveUsers(users) { storage.set(KEYS.users, users); }

function loadState() {
  const saved = storage.get(KEYS.state, null);
  if (saved) state = saved;
}

function saveState() { storage.set(KEYS.state, state); }

// Auth
function register(username, password) {
  const users = loadUsers();
  if (users.find(u => u.username === username)) return { ok: false, error: 'Username already exists' };
  users.push({ username, password });
  saveUsers(users);
  return { ok: true };
}

function login(username, password) {
  const users = loadUsers();
  const found = users.find(u => u.username === username && u.password === password);
  return !!found;
}

function setLoggedIn(username) {
  state.user = { username };
  saveState();
  currentUsernameEl.textContent = username;
  loginScreen.style.display = 'none';
  chatApp.style.display = 'grid';
}

function logout() {
  state.user = null;
  saveState();
  chatApp.style.display = 'none';
  loginScreen.style.display = 'grid';
}

// Servers and channels
function addServer(name) {
  const id = `srv_${Date.now()}`;
  const server = { id, name, channels: [{ id: `chn_${Date.now()}`, name: 'general' }], members: [state.user.username] };
  state.servers.push(server);
  state.activeServerId = id;
  state.activeChannelId = server.channels[0].id;
  saveState();
  renderServers();
  renderChannels();
  updateContextLabels();
  loadMessagesUI();
}

function renderServers() {
  serverList.innerHTML = '';
  state.servers.forEach(s => {
    const btn = document.createElement('button');
    btn.className = `server-item${s.id === state.activeServerId ? ' active' : ''}`;
    btn.title = s.name;
    btn.textContent = s.name.charAt(0).toUpperCase();
    btn.addEventListener('click', () => {
      state.activeServerId = s.id;
      state.activeChannelId = s.channels[0]?.id || null;
      saveState();
      renderServers();
      renderChannels();
      updateContextLabels();
      loadMessagesUI();
      renderMembers();
      enableChatInputs(!!state.activeChannelId);
    });
    serverList.appendChild(btn);
  });
}

function addChannel(name) {
  const server = getActiveServer();
  if (!server) return;
  const id = `chn_${Date.now()}`;
  server.channels.push({ id, name });
  state.activeChannelId = id;
  saveState();
  renderChannels();
  updateContextLabels();
  loadMessagesUI();
}

function renderChannels() {
  channelList.innerHTML = '';
  const server = getActiveServer();
  if (!server) return;
  server.channels.forEach(c => {
    const item = document.createElement('div');
    item.className = `channel-item${c.id === state.activeChannelId ? ' active' : ''}`;
    item.innerHTML = `# ${c.name}`;
    item.addEventListener('click', () => {
      state.activeChannelId = c.id;
      saveState();
      renderChannels();
      updateContextLabels();
      loadMessagesUI();
      enableChatInputs(true);
    });
    channelList.appendChild(item);
  });
}

function updateContextLabels() {
  const s = getActiveServer();
  const c = getActiveChannel();
  currentServerName.textContent = s ? s.name : 'Select a Server';
  currentChannelName.textContent = c ? `# ${c.name}` : '# Select a channel';
}

function getActiveServer() { return state.servers.find(s => s.id === state.activeServerId) || null; }
function getActiveChannel() { return getActiveServer()?.channels.find(c => c.id === state.activeChannelId) || null; }

// Members
function renderMembers() {
  membersList.innerHTML = '';
  const s = getActiveServer();
  if (!s) return;
  s.members.forEach(m => {
    const row = document.createElement('div');
    row.className = 'member';
    row.innerHTML = `<span class="dot"></span><span>${m}</span>`;
    membersList.appendChild(row);
  });
}

// Messages
function loadMessages() {
  const s = state.activeServerId, c = state.activeChannelId;
  if (!s || !c) return [];
  return storage.get(KEYS.messages(s, c), []);
}

function saveMessages(msgs) {
  const s = state.activeServerId, c = state.activeChannelId;
  if (!s || !c) return;
  storage.set(KEYS.messages(s, c), msgs);
}

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `
    <div class="meta"><span class="author">${msg.author}</span><span class="time">${new Date(msg.time).toLocaleTimeString()}</span></div>
    <div class="body"></div>
  `;
  div.querySelector('.body').textContent = msg.text;
  chatBox.appendChild(div);
}

function loadMessagesUI() {
  chatBox.innerHTML = '';
  const msgs = loadMessages();
  msgs.forEach(renderMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendCurrentMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const msg = { id: `msg_${Date.now()}`, text, author: state.user.username, time: Date.now() };
  const msgs = loadMessages();
  msgs.push(msg);
  saveMessages(msgs);
  renderMessage(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  messageInput.value = '';
  messageInput.focus();
}

function enableChatInputs(enabled) {
  messageInput.disabled = !enabled;
  sendButton.disabled = !enabled;
}

// Event wiring
loginBtn?.addEventListener('click', () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;
  if (!u || !p) { alert('Enter username and password'); return; }
  if (login(u, p)) {
    setLoggedIn(u);
    // Initialize if no servers
    if (state.servers.length === 0) { addServer('My Server'); }
    renderServers();
    renderChannels();
    updateContextLabels();
    renderMembers();
    enableChatInputs(!!state.activeChannelId);
    loadMessagesUI();
  } else {
    alert('Invalid credentials');
  }
});

registerBtn?.addEventListener('click', () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value;
  if (!u || !p) { alert('Choose username and password'); return; }
  const res = register(u, p);
  if (!res.ok) { alert(res.error); return; }
  alert('Registered! You can now log in.');
});

logoutBtn?.addEventListener('click', () => {
  logout();
});

addServerBtn?.addEventListener('click', () => {
  const name = prompt('Server name');
  if (name) addServer(name);
});

addChannelBtn?.addEventListener('click', () => {
  const name = prompt('Channel name');
  if (name) addChannel(name);
});

sendButton?.addEventListener('click', sendCurrentMessage);
messageInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendCurrentMessage();
});

toggleMembersBtn?.addEventListener('click', () => {
  membersSidebar.classList.toggle('hidden');
});

// Bootstrap
(function init() {
  loadState();
  // If already logged in, restore session
  if (state.user?.username) {
    setLoggedIn(state.user.username);
    renderServers();
    if (state.servers.length === 0) addServer('My Server');
    renderChannels();
    updateContextLabels();
    renderMembers();
    enableChatInputs(!!state.activeChannelId);
    loadMessagesUI();
  } else {
    loginScreen.style.display = 'grid';
    chatApp.style.display = 'none';
  }
})();
