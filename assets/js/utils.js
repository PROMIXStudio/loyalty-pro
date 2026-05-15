// ================================================================
// LOYALTY PRO - Fonctions utilitaires partagees
// ================================================================

const Utils = {

  formatDate: (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
  },

  formatDatetime: (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  },

  toast: (message, type = 'success') => {
    const bg = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:80px;right:20px;background:${bg[type]};
      color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);animation:lpSlide .3s ease;max-width:300px;line-height:1.4`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  showLoader: () => {
    if (document.getElementById('lp-loader')) return;
    const l = document.createElement('div');
    l.id = 'lp-loader';
    l.style.cssText = `position:fixed;inset:0;background:rgba(255,255,255,0.85);
      display:flex;align-items:center;justify-content:center;z-index:9998;flex-direction:column;gap:12px`;
    l.innerHTML = `
      <div style="width:44px;height:44px;border:3px solid #e5e7eb;
        border-top-color:#4f46e5;border-radius:50%;animation:lpSpin .7s linear infinite"></div>
      <span style="font-size:13px;color:#6b7280">Traitement en cours...</span>`;
    document.body.appendChild(l);
  },

  hideLoader: () => document.getElementById('lp-loader')?.remove(),

  slug: (str) => str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),

  initiales: (nom) => nom?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?',

  formatMontant: (n) => Number(n).toLocaleString('fr-FR') + ' FCFA'
};

// CSS animations globales
const lpStyle = document.createElement('style');
lpStyle.textContent = `
  @keyframes lpSlide { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }
  @keyframes lpSpin  { to{transform:rotate(360deg)} }
`;
document.head.appendChild(lpStyle);