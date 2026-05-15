// ================================================================
// LOYALTY PRO - auth.js
// ================================================================

// ── Déconnexion — disponible IMMÉDIATEMENT (pas dans DOMContentLoaded)
window.lpLogout = function() {
  sessionStorage.removeItem('lp_admin_verified');
  sessionStorage.removeItem('lp_admin_uid');
  try {
    if (typeof auth !== 'undefined') auth.signOut();
  } catch(e) {}
  window.location.replace('index.html');
};

// Alias direct pour les boutons onclick="handleLogout()"
window.handleLogout = window.lpLogout;

// ── Inactivité
window.lpStartInactivity = function(ms) {
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(window.lpLogout, ms);
  };
  ['click','keypress','mousemove','touchstart'].forEach(e =>
    document.addEventListener(e, reset, { passive: true })
  );
  reset();
};

// ── Vérification session + chargement infos admin
window.lpInitAdmin = function() {
  const verified = sessionStorage.getItem('lp_admin_verified');
  const uid      = sessionStorage.getItem('lp_admin_uid');

  if (!verified || !uid) {
    const page = window.location.pathname;
    if (!page.includes('index.html')) {
      window.location.replace('index.html');
    }
    return;
  }

  if (typeof db === 'undefined') return;

  db.collection('admins').doc(uid).get()
    .then(snap => {
      if (!snap.exists) { window.lpLogout(); return; }
      const d  = snap.data();
      const av = document.getElementById('admin-av');
      const nm = document.getElementById('admin-nm');
      if (av) av.textContent = (d.nom || 'AD').slice(0, 2).toUpperCase();
      if (nm) nm.textContent = d.nom || 'Admin';
      window.lpStartInactivity(20 * 60 * 1000);
    })
    .catch(() => window.lpLogout());
};

// Lancer au chargement
document.addEventListener('DOMContentLoaded', window.lpInitAdmin);
