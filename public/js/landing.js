/**
 * MetaPersona — Landing Page JavaScript
 * Handles auth modal, login, signup
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Hide loading splash after short delay
  setTimeout(() => {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 400);
    }
  }, 600);

  // If already logged in, redirect to dashboard
  if (Auth.isLoggedIn()) {
    window.location.href = '/dashboard';
    return;
  }

  initLanding();
});

function initLanding() {
  const authOverlay = document.getElementById('auth-overlay');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');

  // ========================
  // Show/Hide Auth Modal
  // ========================
  function showAuth(tab = 'login') {
    authOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
  }

  function hideAuth() {
    authOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Landing CTA buttons
  document.getElementById('btn-get-started').addEventListener('click', () => showAuth('signup'));
  document.getElementById('btn-sign-in').addEventListener('click', () => showAuth('login'));

  // Close modal on overlay click
  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) hideAuth();
  });

  // Tab switching
  document.getElementById('switch-to-signup').addEventListener('click', () => switchTab('signup'));
  document.getElementById('switch-to-login').addEventListener('click', () => switchTab('login'));

  function switchTab(tab) {
    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      formLogin.classList.add('active');
      formSignup.classList.remove('active');
    } else {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      formSignup.classList.add('active');
      formLogin.classList.remove('active');
    }
    clearMessages();
  }

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));

  // ========================
  // Message helpers
  // ========================
  function showMessage(id, text, type = 'error') {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `form-message ${type}`;
  }

  function clearMessages() {
    document.querySelectorAll('.form-message').forEach(el => {
      el.className = 'form-message';
      el.textContent = '';
    });
  }

  // ========================
  // Password Strength Meter
  // ========================
  const pwInput = document.getElementById('signup-password');
  const strengthIndicator = document.getElementById('password-strength-indicator');
  const strengthText = document.getElementById('strength-text');
  const segments = [
    document.getElementById('str-1'),
    document.getElementById('str-2'),
    document.getElementById('str-3'),
    document.getElementById('str-4'),
  ];

  pwInput.addEventListener('input', () => {
    const val = pwInput.value;
    if (!val) {
      strengthIndicator.style.display = 'none';
      return;
    }
    strengthIndicator.style.display = 'block';

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = ['', 'weak', 'fair', 'strong', 'strong'];
    const labels = ['', '😟 Too weak', '🤔 Fair', '💪 Strong', '🔐 Very Strong'];

    segments.forEach((seg, i) => {
      seg.className = 'strength-segment';
      if (i < score) {
        seg.classList.add('filled', levels[score]);
      }
    });
    strengthText.textContent = labels[score] || '';
  });

  // ========================
  // LOGIN FORM
  // ========================
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const btn = document.getElementById('btn-login');
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    if (!identifier || !password) {
      showMessage('login-message', 'Please fill in all fields.');
      return;
    }

    setButtonLoading(btn, true);
    try {
      const data = await api.post('/auth/login', { identifier, password }, false);
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      Toast.success(`Welcome back, ${data.user.fullName}! 🎉`);
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? '/admin' : '/dashboard';
      }, 800);
    } catch (err) {
      showMessage('login-message', err.message);
      setButtonLoading(btn, false);
    }
  });

  // ========================
  // SIGNUP FORM
  // ========================
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const btn = document.getElementById('btn-signup');
    const fullName = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    // Client-side validation
    if (!fullName || !username || !email || !password || !confirmPassword) {
      showMessage('signup-message', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showMessage('signup-message', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      showMessage('signup-message', 'Password must be at least 8 characters.');
      return;
    }

    setButtonLoading(btn, true);
    try {
      const data = await api.post('/auth/signup', { fullName, username, email, password, confirmPassword }, false);
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      Toast.success(`Welcome to MetaPersona, ${data.user.fullName}! 🌟`);
      setTimeout(() => { window.location.href = '/dashboard'; }, 800);
    } catch (err) {
      showMessage('signup-message', err.message);
      setButtonLoading(btn, false);
    }
  });
}
