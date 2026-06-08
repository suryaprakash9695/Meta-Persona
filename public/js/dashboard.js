/**
 * MetaPersona — Dashboard JavaScript
 * Handles all dashboard sections, CRUD operations, navigation
 */

// ========================
// Global State
// ========================
let currentUser = null;
let profile = null;
let currentSection = 'overview';

// ========================
// Init
// ========================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  currentUser = Auth.getUser();
  if (!currentUser) {
    try {
      const data = await api.get('/auth/me');
      currentUser = data.user;
      Auth.setUser(currentUser);
    } catch {
      Auth.logout();
      return;
    }
  }

  initUI();
  await loadProfile();
  initNavigation();
  initSidebar();
  renderSection('overview');
});

// ========================
// Init UI Elements
// ========================
function initUI() {
  // Sidebar user info
  const initials = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = currentUser.fullName;
  document.getElementById('sidebar-role').textContent = currentUser.role === 'admin' ? '👑 Admin' : '✨ Member';
  document.getElementById('topbar-username').textContent = currentUser.fullName.split(' ')[0];
  document.getElementById('overview-avatar').textContent = initials;
  document.getElementById('overview-name').textContent = currentUser.fullName;
  document.getElementById('overview-email').textContent = currentUser.email;
  document.getElementById('overview-role').textContent = currentUser.role === 'admin' ? '👑 Admin' : '✨ MetaPersona Member';

  // Settings prefill
  document.getElementById('settings-fullname').value = currentUser.fullName;
  document.getElementById('settings-username').value = currentUser.username;
  document.getElementById('settings-email').value = currentUser.email;

  // Sidebar user card → go to settings
  document.getElementById('sidebar-user-card').addEventListener('click', () => navigateTo('settings'));

  // Logout buttons
  document.getElementById('btn-logout').addEventListener('click', () => Auth.logout());
  document.getElementById('btn-logout-settings').addEventListener('click', () => Auth.logout());
}

// ========================
// Load Profile from API
// ========================
async function loadProfile() {
  try {
    const data = await api.get('/profile');
    profile = data.profile;
  } catch (err) {
    Toast.error('Failed to load profile: ' + err.message);
    profile = {};
  }
}

// ========================
// Navigation
// ========================
function initNavigation() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.section);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) closeSidebar();
    });
  });
}

function navigateTo(section) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Update sections
  document.querySelectorAll('.section-page').forEach(p => p.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');

  // Update topbar title
  const titles = {
    overview: 'Overview',
    personal: 'Personal Info',
    education: 'Education',
    career: 'Career',
    achievements: 'Achievements',
    timeline: 'Life Timeline',
    goals: 'Goals',
    memories: 'Memory Vault',
    documents: 'Documents',
    folders: 'Private Folders',
    settings: 'Settings'
  };
  document.getElementById('topbar-title').textContent = titles[section] || section;
  currentSection = section;

  renderSection(section);
}

// ========================
// Sidebar (Mobile)
// ========================
function initSidebar() {
  const menuBtn = document.getElementById('topbar-menu-btn');
  const overlay = document.getElementById('sidebar-overlay');

  menuBtn.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    overlay.classList.toggle('visible');
  });

  overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ========================
// Render Section
// ========================
async function renderSection(section) {
  switch (section) {
    case 'overview': renderOverview(); break;
    case 'personal': renderPersonal(); break;
    case 'education': renderList('education'); break;
    case 'career': renderList('career'); break;
    case 'achievements': renderList('achievements'); break;
    case 'timeline': renderTimeline(); break;
    case 'goals': renderGoals(); break;
    case 'memories': renderMemories(); break;
    case 'documents': renderList('documents'); break;
    case 'folders': await loadFolders(); break;
  }
}

// ========================
// OVERVIEW
// ========================
function renderOverview() {
  if (!profile) return;

  const sections = [
    { key: 'education', label: 'Education', icon: '📚', color: 'purple' },
    { key: 'career', label: 'Career', icon: '💼', color: 'blue' },
    { key: 'achievements', label: 'Achievements', icon: '🏆', color: 'orange' },
    { key: 'goals', label: 'Goals', icon: '🎯', color: 'green' },
    { key: 'memories', label: 'Memories', icon: '⭐', color: 'pink' },
    { key: 'timeline', label: 'Timeline Events', icon: '📅', color: 'purple' },
    { key: 'documents', label: 'Documents', icon: '📄', color: 'blue' },
  ];

  document.getElementById('stats-grid').innerHTML = sections.map(s => `
    <div class="stat-card" role="button" onclick="navigateTo('${s.key === 'timeline' ? 'timeline' : s.key}')" style="cursor:pointer;">
      <div class="stat-icon ${s.color}">${s.icon}</div>
      <div class="stat-value">${(profile[s.key] || []).length}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  const quickActions = [
    { section: 'personal', icon: '👤', title: 'Update Personal Info', desc: 'Keep your identity data fresh' },
    { section: 'education', icon: '📚', title: 'Add Education', desc: 'Log your academic journey' },
    { section: 'career', icon: '💼', title: 'Add Work Experience', desc: 'Track your career path' },
    { section: 'goals', icon: '🎯', title: 'Set a New Goal', desc: 'Plan your next big achievement' },
    { section: 'memories', icon: '⭐', title: 'Capture a Memory', desc: 'Preserve precious moments' },
    { section: 'folders', icon: '🔒', title: 'Private Folders', desc: 'Manage your secure spaces' },
  ];

  document.getElementById('overview-quick-cards').innerHTML = quickActions.map(a => `
    <div class="data-card" onclick="navigateTo('${a.section}')" style="cursor:pointer;">
      <div style="font-size:2.5rem;margin-bottom:var(--space-3);">${a.icon}</div>
      <div class="data-card-title">${a.title}</div>
      <p class="data-card-body" style="margin-top:var(--space-2);">${a.desc}</p>
    </div>
  `).join('');
}

// ========================
// PERSONAL INFO
// ========================
function renderPersonal() {
  if (!profile?.personalInfo) return;
  const p = profile.personalInfo;

  const fields = ['phone', 'dateOfBirth', 'gender', 'nationality', 'bio', 'city', 'country', 'address', 'website', 'linkedin', 'github', 'twitter'];
  fields.forEach(f => {
    const el = document.getElementById(`pi-${f === 'dateOfBirth' ? 'dob' : f}`);
    if (el) el.value = p[f] || '';
  });

  // Array fields
  ['skills', 'languages', 'interests'].forEach(f => {
    const el = document.getElementById(`pi-${f}`);
    if (el) el.value = (p[f] || []).join(', ');
  });

  document.getElementById('btn-save-personal').onclick = savePersonal;
}

async function savePersonal() {
  const form = document.getElementById('personal-form');
  const btn = document.getElementById('btn-save-personal');

  const data = {};
  form.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  // Convert comma arrays
  ['skills', 'languages', 'interests'].forEach(f => {
    if (data[f]) {
      data[f] = data[f].split(',').map(s => s.trim()).filter(Boolean);
    }
  });

  setButtonLoading(btn, true);
  try {
    const res = await api.put('/profile/personal-info', data);
    if (profile) profile.personalInfo = res.personalInfo;
    Toast.success('Personal info saved! ✅');
  } catch (err) {
    Toast.error(err.message);
  }
  setButtonLoading(btn, false);
}

// ========================
// GENERIC LIST RENDERER
// ========================
function renderList(section) {
  const items = profile?.[section] || [];
  const container = document.getElementById(`${section}-list`);

  if (!container) return;

  if (items.length === 0) {
    const labels = { education: ['📚', 'No education added'], career: ['💼', 'No career history'], achievements: ['🏆', 'No achievements'], documents: ['📄', 'No documents'] };
    const [icon, text] = labels[section] || ['📋', 'Nothing here'];
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">${icon}</div><h3>${text}</h3></div>`;
    return;
  }

  container.innerHTML = items.map(item => buildCard(section, item)).join('');

  // Add button handlers
  document.getElementById(`btn-add-${section === 'documents' ? 'document' : section === 'achievements' ? 'achievement' : section}`)?.addEventListener('click', () => openAddModal(section));
}

function buildCard(section, item) {
  const editBtn = `<button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('${section}','${item._id}')" title="Edit">✏️</button>`;
  const deleteBtn = `<button class="btn btn-danger btn-icon btn-sm" onclick="deleteItem('${section}','${item._id}')" title="Delete">🗑️</button>`;

  const cards = {
    education: `
      <div class="data-card fade-in">
        <div class="data-card-header">
          <div>
            <div class="data-card-title">${item.institution}</div>
            <div class="data-card-subtitle">${item.degree || ''} ${item.field ? `in ${item.field}` : ''}</div>
          </div>
          <div class="data-card-actions">${editBtn}${deleteBtn}</div>
        </div>
        <div class="data-card-meta">
          ${item.startYear ? `<span>📅 ${item.startYear} — ${item.endYear || 'Present'}</span>` : ''}
          ${item.grade ? `<span>🎓 ${item.grade}</span>` : ''}
        </div>
        ${item.description ? `<p class="data-card-body" style="margin-top:var(--space-3);">${item.description}</p>` : ''}
      </div>`,

    career: `
      <div class="data-card fade-in">
        <div class="data-card-header">
          <div>
            <div class="data-card-title">${item.position || 'Position'} at ${item.company}</div>
            <div class="data-card-subtitle">${item.location || ''}</div>
          </div>
          <div class="data-card-actions">${editBtn}${deleteBtn}</div>
        </div>
        <div class="data-card-meta">
          ${item.startDate ? `<span>📅 ${item.startDate} — ${item.current ? 'Present' : (item.endDate || '')}</span>` : ''}
          ${item.current ? `<span class="badge badge-success">Current</span>` : ''}
        </div>
        ${item.description ? `<p class="data-card-body" style="margin-top:var(--space-3);">${item.description}</p>` : ''}
      </div>`,

    achievements: `
      <div class="data-card fade-in">
        <div class="data-card-header">
          <div>
            <div class="data-card-title">🏆 ${item.title}</div>
            <div class="data-card-subtitle">${item.issuer || item.category || ''}</div>
          </div>
          <div class="data-card-actions">${editBtn}${deleteBtn}</div>
        </div>
        ${item.date ? `<div class="data-card-meta"><span>📅 ${item.date}</span></div>` : ''}
        ${item.description ? `<p class="data-card-body" style="margin-top:var(--space-3);">${item.description}</p>` : ''}
      </div>`,

    documents: `
      <div class="data-card fade-in">
        <div class="data-card-header">
          <div>
            <div class="data-card-title">📄 ${item.name}</div>
            <div class="data-card-subtitle">${item.type || 'Document'}</div>
          </div>
          <div class="data-card-actions">${editBtn}${deleteBtn}</div>
        </div>
        ${item.description ? `<p class="data-card-body" style="margin-top:var(--space-3);">${item.description}</p>` : ''}
        ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:var(--space-3);display:inline-flex;">🔗 View Document</a>` : ''}
      </div>`
  };

  return cards[section] || `<div class="data-card">${JSON.stringify(item)}</div>`;
}

// ========================
// TIMELINE
// ========================
function renderTimeline() {
  const items = (profile?.timeline || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const container = document.getElementById('timeline-list');

  document.getElementById('btn-add-timeline').onclick = () => openAddModal('timeline');

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No events yet</h3></div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="timeline-item fade-in">
      <div class="timeline-dot">${item.icon || '⭐'}</div>
      <div class="timeline-content">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="timeline-title">${item.title}</div>
            ${item.date ? `<div class="timeline-date">📅 ${item.date}</div>` : ''}
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('timeline','${item._id}')">✏️</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteItem('timeline','${item._id}')">🗑️</button>
          </div>
        </div>
        ${item.description ? `<p class="timeline-desc">${item.description}</p>` : ''}
        ${item.category ? `<span class="badge badge-primary" style="margin-top:var(--space-2);">${item.category}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ========================
// GOALS
// ========================
function renderGoals() {
  const items = profile?.goals || [];
  const container = document.getElementById('goals-list');

  document.getElementById('btn-add-goal').onclick = () => openAddModal('goals');

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div><h3>No goals yet</h3></div>`;
    return;
  }

  const priorityColors = { High: 'danger', Medium: 'warning', Low: 'info' };
  const statusColors = { 'Completed': 'success', 'In Progress': 'primary', 'Not Started': 'info', 'On Hold': 'warning' };

  container.innerHTML = items.map(item => `
    <div class="goal-item fade-in">
      <div class="goal-header">
        <div>
          <div style="font-weight:700;font-size:1rem;margin-bottom:4px;">${item.title}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);">${item.description || ''}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('goals','${item._id}')">✏️</button>
          <button class="btn btn-danger btn-icon btn-sm" onclick="deleteItem('goals','${item._id}')">🗑️</button>
        </div>
      </div>
      <div class="goal-meta">
        <span class="badge badge-${priorityColors[item.priority] || 'info'}">${item.priority || 'Medium'} Priority</span>
        <span class="badge badge-${statusColors[item.status] || 'info'}">${item.status || 'Not Started'}</span>
        ${item.targetDate ? `<span class="text-muted text-sm">📅 ${item.targetDate}</span>` : ''}
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width:${item.progress || 0}%;"></div>
      </div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">${item.progress || 0}% complete</div>
    </div>
  `).join('');
}

// ========================
// MEMORIES
// ========================
function renderMemories() {
  const items = profile?.memories || [];
  const container = document.getElementById('memories-list');

  document.getElementById('btn-add-memory').onclick = () => openAddModal('memories');

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⭐</div><h3>No memories yet</h3></div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="memory-card fade-in">
      <div class="memory-card-body">
        <div class="memory-mood">${item.mood || '😊'}</div>
        <div class="memory-title">${item.title}</div>
        <p class="memory-desc">${item.description || ''}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:var(--space-3);">
          <div style="font-size:0.78rem;color:var(--text-muted);">
            ${item.date ? `📅 ${item.date}` : ''} ${item.location ? `📍 ${item.location}` : ''}
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="openEditModal('memories','${item._id}')">✏️</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteItem('memories','${item._id}')">🗑️</button>
          </div>
        </div>
        ${item.tags?.length ? `
          <div class="memory-tags">
            ${item.tags.map(t => `<span class="memory-tag">${t}</span>`).join('')}
          </div>` : ''}
      </div>
    </div>
  `).join('');
}

// ========================
// ADD/EDIT Modal Schemas
// ========================
const modalSchemas = {
  education: {
    title: 'Education',
    fields: [
      { name: 'institution', label: 'Institution / School', type: 'text', required: true, placeholder: 'IIT Delhi, MIT...' },
      { name: 'degree', label: 'Degree / Certificate', type: 'text', placeholder: 'B.Tech, M.Sc, MBA...' },
      { name: 'field', label: 'Field of Study', type: 'text', placeholder: 'Computer Science...' },
      [
        { name: 'startYear', label: 'Start Year', type: 'text', placeholder: '2018' },
        { name: 'endYear', label: 'End Year', type: 'text', placeholder: '2022 or Present' }
      ],
      { name: 'grade', label: 'Grade / CGPA', type: 'text', placeholder: '9.5/10, A+...' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Key courses, achievements...' },
    ]
  },
  career: {
    title: 'Work Experience',
    fields: [
      { name: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Google, Startup XYZ...' },
      { name: 'position', label: 'Position / Role', type: 'text', placeholder: 'Senior Developer...' },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Remote, New York...' },
      [
        { name: 'startDate', label: 'Start Date', type: 'text', placeholder: 'Jan 2022' },
        { name: 'endDate', label: 'End Date', type: 'text', placeholder: 'Dec 2023 or Present' }
      ],
      { name: 'current', label: 'Currently Working Here?', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Key responsibilities, projects...' },
    ]
  },
  achievements: {
    title: 'Achievement',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: '1st Prize in Hackathon...' },
      { name: 'issuer', label: 'Issued By', type: 'text', placeholder: 'Organization name...' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Academic, Sports, Tech...' },
      { name: 'date', label: 'Date', type: 'text', placeholder: 'March 2023' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about this achievement...' },
    ]
  },
  timeline: {
    title: 'Life Event',
    fields: [
      { name: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'Got my first job...' },
      { name: 'icon', label: 'Icon (emoji)', type: 'text', placeholder: '🎉' },
      { name: 'date', label: 'Date', type: 'text', placeholder: 'June 2022' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Career, Personal, Education...' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What happened...' },
    ]
  },
  goals: {
    title: 'Goal',
    fields: [
      { name: 'title', label: 'Goal Title', type: 'text', required: true, placeholder: 'Build my dream app...' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What you want to achieve...' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Career, Health, Finance...' },
      { name: 'targetDate', label: 'Target Date', type: 'text', placeholder: 'December 2025' },
      [
        {
          name: 'priority', label: 'Priority', type: 'select',
          options: ['Low', 'Medium', 'High']
        },
        {
          name: 'status', label: 'Status', type: 'select',
          options: ['Not Started', 'In Progress', 'Completed', 'On Hold']
        }
      ],
      { name: 'progress', label: 'Progress (0-100)', type: 'number', placeholder: '0' },
    ]
  },
  memories: {
    title: 'Memory',
    fields: [
      { name: 'title', label: 'Memory Title', type: 'text', required: true, placeholder: 'Graduation day...' },
      { name: 'mood', label: 'Mood (emoji)', type: 'text', placeholder: '😊 🎉 ❤️...' },
      { name: 'date', label: 'Date', type: 'text', placeholder: 'May 2023' },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Paris, France' },
      { name: 'description', label: 'Memory', type: 'textarea', placeholder: 'Describe this precious moment...' },
      { name: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'family, travel, fun...' },
    ]
  },
  documents: {
    title: 'Document',
    fields: [
      { name: 'name', label: 'Document Name', type: 'text', required: true, placeholder: 'Passport, Degree Certificate...' },
      { name: 'type', label: 'Document Type', type: 'text', placeholder: 'ID, Certificate, Contract...' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Additional notes...' },
      { name: 'fileUrl', label: 'File URL (optional)', type: 'url', placeholder: 'https://drive.google.com/...' },
    ]
  }
};

// ========================
// Open Add Modal
// ========================
function openAddModal(section) {
  const schema = modalSchemas[section];
  if (!schema) return;

  const formHtml = buildFormHtml(schema.fields);
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h3>➕ Add ${schema.title}</h3>
      <button class="modal-close" data-modal-close>✕</button>
    </div>
    <form id="modal-form" novalidate>
      ${formHtml}
      <div style="display:flex;gap:12px;margin-top:var(--space-6);">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="modal-submit-btn" style="flex:1;">Save ${schema.title}</button>
      </div>
    </form>
  `);

  overlay.querySelector('#modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#modal-submit-btn');
    const data = collectFormData(overlay, schema.fields);

    setButtonLoading(btn, true);
    try {
      const res = await api.post(`/profile/${section}`, data);
      if (!profile[section]) profile[section] = [];
      profile[section].push(res.item);
      Toast.success(`${schema.title} added! ✅`);
      close();
      renderSection(section);
    } catch (err) {
      Toast.error(err.message);
      setButtonLoading(btn, false);
    }
  });
}

// ========================
// Open Edit Modal
// ========================
function openEditModal(section, itemId) {
  const schema = modalSchemas[section];
  if (!schema) return;

  const item = (profile[section] || []).find(i => i._id === itemId);
  if (!item) return;

  const formHtml = buildFormHtml(schema.fields, item);
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h3>✏️ Edit ${schema.title}</h3>
      <button class="modal-close" data-modal-close>✕</button>
    </div>
    <form id="modal-form-edit" novalidate>
      ${formHtml}
      <div style="display:flex;gap:12px;margin-top:var(--space-6);">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="modal-edit-btn" style="flex:1;">Save Changes</button>
      </div>
    </form>
  `);

  overlay.querySelector('#modal-form-edit').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#modal-edit-btn');
    const data = collectFormData(overlay, schema.fields);

    setButtonLoading(btn, true);
    try {
      const res = await api.put(`/profile/${section}/${itemId}`, data);
      const idx = profile[section].findIndex(i => i._id === itemId);
      if (idx !== -1) profile[section][idx] = res.item;
      Toast.success(`${schema.title} updated! ✅`);
      close();
      renderSection(section);
    } catch (err) {
      Toast.error(err.message);
      setButtonLoading(btn, false);
    }
  });
}

// ========================
// Delete Item
// ========================
async function deleteItem(section, itemId) {
  const confirmed = await confirmAction('Permanently delete this item?');
  if (!confirmed) return;

  try {
    await api.delete(`/profile/${section}/${itemId}`);
    profile[section] = profile[section].filter(i => i._id !== itemId);
    Toast.success('Deleted successfully!');
    renderSection(section);
  } catch (err) {
    Toast.error(err.message);
  }
}

// ========================
// Form Helpers
// ========================
function buildFormHtml(fields, values = {}) {
  return fields.map(f => {
    if (Array.isArray(f)) {
      return `<div class="form-row">${f.map(ff => buildFieldHtml(ff, values)).join('')}</div>`;
    }
    return buildFieldHtml(f, values);
  }).join('');
}

function buildFieldHtml(f, values) {
  const val = values[f.name] !== undefined ? values[f.name] : '';

  if (f.type === 'textarea') {
    return `
      <div class="form-group">
        <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
        <textarea name="${f.name}" class="form-input" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${val}</textarea>
      </div>`;
  }

  if (f.type === 'select') {
    const opts = f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
    return `
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <select name="${f.name}" class="form-input"><option value="">Select...</option>${opts}</select>
      </div>`;
  }

  if (f.type === 'checkbox') {
    return `
      <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-3);">
        <input type="checkbox" name="${f.name}" id="field-${f.name}" style="width:18px;height:18px;cursor:pointer;" ${val ? 'checked' : ''} />
        <label for="field-${f.name}" class="form-label" style="margin:0;cursor:pointer;">${f.label}</label>
      </div>`;
  }

  return `
    <div class="form-group">
      <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
      <input type="${f.type || 'text'}" name="${f.name}" class="form-input"
        placeholder="${f.placeholder || ''}"
        value="${val}"
        ${f.required ? 'required' : ''}
        ${f.type === 'number' ? 'min="0" max="100"' : ''} />
    </div>`;
}

function collectFormData(overlay, fields) {
  const data = {};
  const flatFields = fields.flat();
  flatFields.forEach(f => {
    const el = overlay.querySelector(`[name="${f.name}"]`);
    if (!el) return;
    if (f.type === 'checkbox') {
      data[f.name] = el.checked;
    } else if (f.name === 'tags') {
      data[f.name] = el.value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (f.name === 'progress') {
      data[f.name] = parseInt(el.value) || 0;
    } else {
      data[f.name] = el.value;
    }
  });
  return data;
}

// ========================
// ADD BUTTONS — bind section buttons that don't have dynamic sections
// ========================
function bindAddButtons() {
  const map = {
    'btn-add-education': 'education',
    'btn-add-career': 'career',
    'btn-add-achievement': 'achievements',
    'btn-add-document': 'documents',
  };
  Object.entries(map).forEach(([btnId, section]) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener('click', () => openAddModal(section));
  });
}

bindAddButtons();

// ========================
// PRIVATE FOLDERS
// ========================
async function loadFolders() {
  const grid = document.getElementById('folders-grid');
  grid.innerHTML = `<div style="display:flex;justify-content:center;padding:40px;grid-column:1/-1;"><div class="spinner"></div></div>`;

  try {
    const data = await api.get('/folders');
    renderFolders(data.folders);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Failed to load folders: ${err.message}</p></div>`;
  }

  document.getElementById('btn-create-folder').onclick = openCreateFolderModal;
}

function renderFolders(folders) {
  const grid = document.getElementById('folders-grid');

  if (folders.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔒</div>
        <h3>No private folders yet</h3>
        <p>Create a password-protected folder for your most sensitive data</p>
      </div>`;
    return;
  }

  grid.innerHTML = folders.map(f => `
    <div class="folder-card fade-in" data-folder-id="${f._id}" onclick="openFolderModal('${f._id}','${escHtml(f.folderName)}','${escHtml(f.emoji)}')">
      <div class="folder-icon">
        ${f.emoji || '🔒'}
        <div class="folder-lock-badge">🔒</div>
      </div>
      <div class="folder-name">${escHtml(f.folderName)}</div>
      <div class="folder-meta">${(f.itemCount || 0)} items • Click to unlock</div>
    </div>
  `).join('');
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// Create Folder Modal
function openCreateFolderModal() {
  const emojis = ['🔒','📁','💎','🗝️','🛡️','🌟','💰','🔐','📂','🗃️'];
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h3>🔒 Create Private Folder</h3>
      <button class="modal-close" data-modal-close>✕</button>
    </div>
    <form id="create-folder-form" novalidate>
      <div class="form-group">
        <label class="form-label">Folder Name *</label>
        <input type="text" id="cf-name" name="folderName" class="form-input" placeholder="My Secret Plans..." required />
      </div>
      <div class="form-group">
        <label class="form-label">Choose Emoji</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
          ${emojis.map(e => `<button type="button" class="folder-emoji-btn" data-emoji="${e}" style="font-size:1.5rem;padding:6px 8px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;cursor:pointer;transition:all 0.2s;">${e}</button>`).join('')}
        </div>
        <input type="hidden" id="cf-emoji" name="emoji" value="🔒" />
      </div>
      <div class="form-group">
        <label class="form-label">Folder Password *</label>
        <input type="password" id="cf-password" name="password" class="form-input" placeholder="Set a secure password" required />
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password *</label>
        <input type="password" id="cf-confirm" name="confirmPassword" class="form-input" placeholder="Repeat password" required />
      </div>
      <div style="display:flex;gap:12px;margin-top:var(--space-6);">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="cf-submit" style="flex:1;">🔒 Create Folder</button>
      </div>
    </form>
  `);

  // Emoji picker
  overlay.querySelectorAll('.folder-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.folder-emoji-btn').forEach(b => b.style.borderColor = 'var(--color-border)');
      btn.style.borderColor = 'var(--brand-primary)';
      overlay.querySelector('#cf-emoji').value = btn.dataset.emoji;
    });
  });
  // Set first emoji as selected
  const firstBtn = overlay.querySelector('.folder-emoji-btn');
  if (firstBtn) firstBtn.style.borderColor = 'var(--brand-primary)';

  overlay.querySelector('#create-folder-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#cf-submit');
    const folderName = overlay.querySelector('#cf-name').value.trim();
    const password = overlay.querySelector('#cf-password').value;
    const confirmPassword = overlay.querySelector('#cf-confirm').value;
    const emoji = overlay.querySelector('#cf-emoji').value;

    if (password !== confirmPassword) { Toast.error('Passwords do not match!'); return; }

    setButtonLoading(btn, true);
    try {
      await api.post('/folders', { folderName, password, confirmPassword, emoji });
      Toast.success('Private folder created! 🔒');
      close();
      await loadFolders();
    } catch (err) {
      Toast.error(err.message);
      setButtonLoading(btn, false);
    }
  });
}

// Unlock and Open Folder Modal
async function openFolderModal(folderId, folderName, emoji) {
  const folderCard = document.querySelector(`[data-folder-id="${folderId}"]`);
  if (folderCard) folderCard.classList.add('unlocking');

  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h3>${emoji} Unlock Folder</h3>
      <button class="modal-close" data-modal-close>✕</button>
    </div>
    <p style="color:var(--text-secondary);margin-bottom:var(--space-5);font-size:0.9rem;">
      Enter the password for <strong style="color:var(--text-primary);">"${folderName}"</strong> to unlock it.
    </p>
    <form id="unlock-form" novalidate>
      <div class="form-group">
        <label class="form-label">Folder Password</label>
        <input type="password" id="unlock-password" class="form-input" placeholder="Enter folder password" required autofocus />
      </div>
      <div style="display:flex;gap:12px;margin-top:var(--space-5);">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="unlock-btn" style="flex:1;">🔓 Unlock</button>
      </div>
    </form>
  `);

  overlay.querySelector('#unlock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#unlock-btn');
    const password = overlay.querySelector('#unlock-password').value;

    setButtonLoading(btn, true);
    try {
      const res = await api.post(`/folders/${folderId}/unlock`, { password });
      close();
      openFolderContents(res.folder, password);
    } catch (err) {
      Toast.error(err.message);
      setButtonLoading(btn, false);
    } finally {
      if (folderCard) setTimeout(() => folderCard.classList.remove('unlocking'), 500);
    }
  });
}

// Inside Folder View
function openFolderContents(folder, unlockedPassword) {
  const items = folder.items || [];

  const itemsHtml = items.length === 0
    ? `<div class="empty-state" style="padding:var(--space-8) 0;"><div class="empty-state-icon">📭</div><h3>Empty folder</h3><p>Add notes or files below</p></div>`
    : items.map(item => `
        <div class="data-card fade-in" style="margin-bottom:var(--space-3);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);">
            <div>
              <div style="font-weight:700;">${item.type === 'note' ? '📝' : '📎'} ${item.title}</div>
              ${item.content ? `<p style="font-size:0.88rem;color:var(--text-secondary);margin-top:6px;white-space:pre-wrap;">${item.content}</p>` : ''}
            </div>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteFolderItem('${folder._id}','${item._id}','${unlockedPassword}',this)">🗑️</button>
          </div>
        </div>
      `).join('');

  const { overlay, close } = openModal(`
    <div class="modal-header">
      <div>
        <h3>${folder.emoji || '🔒'} ${folder.folderName}</h3>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">${items.length} items • Unlocked</p>
      </div>
      <button class="modal-close" data-modal-close>✕</button>
    </div>

    <div id="folder-items-container">${itemsHtml}</div>

    <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-5) 0;" />
    <h4 style="margin-bottom:var(--space-4);">➕ Add New Note</h4>
    <form id="add-folder-item-form">
      <div class="form-group">
        <label class="form-label">Note Title</label>
        <input type="text" id="fi-title" class="form-input" placeholder="Title..." required />
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea id="fi-content" class="form-input" rows="4" placeholder="Your private note..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="fi-submit">Save Note</button>
    </form>

    <div style="display:flex;gap:8px;margin-top:var(--space-5);">
      <button class="btn btn-secondary btn-sm" id="btn-folder-settings" style="flex:1;">⚙️ Folder Settings</button>
      <button class="btn btn-danger btn-sm" id="btn-delete-folder">🗑️ Delete Folder</button>
    </div>
  `, null);

  // Adjust modal size
  const modal = overlay.querySelector('.modal');
  modal.style.maxWidth = '600px';
  modal.style.maxHeight = '85vh';

  overlay.querySelector('#add-folder-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#fi-submit');
    const title = overlay.querySelector('#fi-title').value.trim();
    const content = overlay.querySelector('#fi-content').value;

    if (!title) { Toast.error('Note title is required'); return; }

    setButtonLoading(btn, true);
    try {
      const res = await api.post(`/folders/${folder._id}/items`, { password: unlockedPassword, type: 'note', title, content });
      folder.items.push(res.item);
      overlay.querySelector('#fi-title').value = '';
      overlay.querySelector('#fi-content').value = '';
      Toast.success('Note added! 📝');
      // Refresh items display
      overlay.querySelector('#folder-items-container').innerHTML = folder.items.map(item => `
        <div class="data-card fade-in" style="margin-bottom:var(--space-3);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);">
            <div>
              <div style="font-weight:700;">📝 ${item.title}</div>
              ${item.content ? `<p style="font-size:0.88rem;color:var(--text-secondary);margin-top:6px;white-space:pre-wrap;">${item.content}</p>` : ''}
            </div>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteFolderItem('${folder._id}','${item._id}','${unlockedPassword}',this)">🗑️</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      Toast.error(err.message);
    }
    setButtonLoading(btn, false);
  });

  // Folder settings
  overlay.querySelector('#btn-folder-settings').addEventListener('click', () => {
    close();
    openFolderSettingsModal(folder, unlockedPassword);
  });

  // Delete folder
  overlay.querySelector('#btn-delete-folder').addEventListener('click', async () => {
    const confirmed = await confirmAction(`Permanently delete "${folder.folderName}" and ALL its contents?`);
    if (!confirmed) return;
    try {
      await api.delete(`/folders/${folder._id}`, { password: unlockedPassword });
      Toast.success('Folder deleted!');
      close();
      await loadFolders();
    } catch (err) {
      Toast.error(err.message);
    }
  });
}

// Delete folder item
async function deleteFolderItem(folderId, itemId, password, btn) {
  const confirmed = await confirmAction('Delete this item?');
  if (!confirmed) return;
  setButtonLoading(btn, true);
  try {
    await api.delete(`/folders/${folderId}/items/${itemId}`, { password });
    btn.closest('.data-card').remove();
    Toast.success('Item deleted!');
  } catch (err) {
    Toast.error(err.message);
    setButtonLoading(btn, false);
  }
}

// Folder Settings Modal
function openFolderSettingsModal(folder, currentPassword) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h3>⚙️ Folder Settings</h3>
      <button class="modal-close" data-modal-close>✕</button>
    </div>
    <form id="folder-settings-form">
      <div class="form-group">
        <label class="form-label">Folder Name</label>
        <input type="text" id="fs-name" class="form-input" value="${folder.folderName}" />
      </div>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-4) 0;" />
      <h4 style="margin-bottom:var(--space-4);">🔑 Change Password (optional)</h4>
      <div class="form-group">
        <label class="form-label">New Password</label>
        <input type="password" id="fs-new-password" class="form-input" placeholder="Leave blank to keep current" />
      </div>
      <div style="display:flex;gap:12px;margin-top:var(--space-5);">
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="fs-submit" style="flex:1;">Save Settings</button>
      </div>
    </form>
  `);

  overlay.querySelector('#folder-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#fs-submit');
    const folderName = overlay.querySelector('#fs-name').value.trim();
    const newPassword = overlay.querySelector('#fs-new-password').value;

    const payload = { currentPassword, folderName };
    if (newPassword) payload.newPassword = newPassword;

    setButtonLoading(btn, true);
    try {
      await api.put(`/folders/${folder._id}`, payload);
      Toast.success('Folder settings saved!');
      close();
      await loadFolders();
    } catch (err) {
      Toast.error(err.message);
      setButtonLoading(btn, false);
    }
  });
}

// ========================
// SETTINGS
// ========================
document.getElementById('settings-account-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save-account');
  const fullName = document.getElementById('settings-fullname').value.trim();
  const username = document.getElementById('settings-username').value.trim();

  setButtonLoading(btn, true);
  try {
    const res = await api.put('/profile/user-info', { fullName, username });
    currentUser = { ...currentUser, ...res.user };
    Auth.setUser(currentUser);
    document.getElementById('sidebar-name').textContent = currentUser.fullName;
    Toast.success('Account info updated! ✅');
  } catch (err) {
    Toast.error(err.message);
  }
  setButtonLoading(btn, false);
});

document.getElementById('settings-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-change-password');
  const currentPassword = document.getElementById('settings-current-pw').value;
  const newPassword = document.getElementById('settings-new-pw').value;
  const confirmNewPassword = document.getElementById('settings-confirm-pw').value;

  if (newPassword !== confirmNewPassword) {
    Toast.error('New passwords do not match!');
    return;
  }
  if (newPassword.length < 8) {
    Toast.error('New password must be at least 8 characters.');
    return;
  }

  setButtonLoading(btn, true);
  try {
    await api.put('/auth/change-password', { currentPassword, newPassword });
    Toast.success('Password changed successfully! 🔑');
    document.getElementById('settings-password-form').reset();
  } catch (err) {
    Toast.error(err.message);
  }
  setButtonLoading(btn, false);
});

// Expose functions globally for inline onclick handlers
window.navigateTo = navigateTo;
window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
window.openFolderModal = openFolderModal;
window.deleteFolderItem = deleteFolderItem;
