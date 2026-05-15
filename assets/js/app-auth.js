// ================================================================
// LOYALTY PRO - app-auth.js
// Gestion session boutique — inclus dans toutes les pages app/
// ================================================================

// ── Déconnexion disponible immédiatement ─────────────────────
window.appLogout = function() {
  sessionStorage.removeItem('lp_boutique_id');
  sessionStorage.removeItem('lp_boutique_nom');
  sessionStorage.removeItem('lp_role');
  sessionStorage.removeItem('lp_email');
  sessionStorage.removeItem('lp_gerant_nom');
  try { if (typeof auth !== 'undefined') auth.signOut(); } catch(e) {}
  window.location.replace('index.html');
};

window.handleLogout = window.appLogout;

// ── Pages qui NE nécessitent PAS de session ───────────────────
const PAGES_PUBLIQUES = ['index.html', 'paiement.html'];

function estPagePublique() {
  const path = window.location.pathname;
  // Vérifier si la page courante est dans la liste publique
  return PAGES_PUBLIQUES.some(p => path.endsWith(p) || path.includes('/' + p));
}

// ── Vérifier session boutique ─────────────────────────────────
window.appInitBoutique = async function() {
  const boutiqueId = sessionStorage.getItem('lp_boutique_id');

  if (!boutiqueId) {
    if (!estPagePublique()) {
      window.location.replace('index.html');
    }
    return false;
  }

  try {
    const snap = await db.collection('boutiques').doc(boutiqueId).get();
    if (!snap.exists) { window.appLogout(); return false; }

    const boutique = snap.data();
    const fin  = boutique.abonnement?.fin?.toMillis?.() || 0;
    const diff = fin - Date.now();

    // Abonnement expiré — laisser accès à paiement.html
    if ((diff <= 0 || !boutique.abonnement?.actif) && !estPagePublique()) {
      showExpiredPage(boutique);
      return false;
    }

    // Alerte expiration proche
    const jrs = Math.ceil(diff / 86400000);
    const min = Math.ceil(diff / 60000);
    if (jrs <= 5 && diff > 0) {
      showSubscriptionBanner(jrs, min, boutique);
    }

    // Remplir le nom dans le header
    const headerTitle = document.getElementById('app-header-title');
    if (headerTitle) headerTitle.textContent = boutique.nom || boutiqueId;

    // Surveillance abonnement toutes les 30s
    window._subCheck = setInterval(async () => {
      try {
        const s = await db.collection('boutiques').doc(boutiqueId).get();
        if (!s.exists) return;
        const f = s.data().abonnement?.fin?.toMillis?.() || 0;
        if (Date.now() >= f && !estPagePublique()) {
          clearInterval(window._subCheck);
          showExpiredPage(s.data());
        }
      } catch(e) {}
    }, 30000);

    return boutique;

  } catch(e) {
    console.error('Erreur vérification session:', e);
    return false;
  }
};

// ── Page expiration ───────────────────────────────────────────
function showExpiredPage(boutique) {
  if (window._subCheck) clearInterval(window._subCheck);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;
                min-height:100vh;background:#f0f4ff;font-family:'DM Sans',sans-serif;padding:1rem">
      <div style="background:#fff;border-radius:20px;padding:2.5rem;text-align:center;
                  max-width:420px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.1)">
        <div style="font-size:3.5rem;margin-bottom:1rem">🔒</div>
        <h2 style="color:#1e1b4b;font-size:1.4rem;margin-bottom:.5rem;font-weight:700">
          Abonnement expiré
        </h2>
        <p style="color:#64748b;margin-bottom:.5rem;line-height:1.6">
          L'abonnement de <strong>${boutique.nom || 'votre boutique'}</strong> est terminé.
        </p>
        <p style="color:#64748b;margin-bottom:1.5rem;font-size:13px">
          Renouvelez pour continuer à utiliser Loyalty Pro.
        </p>
        <a href="paiement.html"
           style="display:block;background:linear-gradient(135deg,#4338ca,#6d28d9);
                  color:#fff;padding:.85rem 2rem;border-radius:12px;text-decoration:none;
                  font-weight:600;font-size:15px;margin-bottom:.75rem">
          💳 Renouveler maintenant
        </a>
        <a href="index.html"
           style="font-size:13px;color:#64748b;text-decoration:none;display:inline-block">
          ← Se reconnecter
        </a>
      </div>
    </div>`;
}

// ── Bannière alerte ───────────────────────────────────────────
function showSubscriptionBanner(jrs, min, boutique) {
  const banner = document.getElementById('sub-banner');
  if (!banner) return;
  let msg, cls;
  if (jrs <= 1 && min <= 60) {
    msg = `⚠️ Abonnement expire dans ${min} minute${min>1?'s':''} !`;
    cls = 'critique';
  } else if (jrs <= 1) {
    msg = `⚠️ Abonnement expire aujourd'hui !`;
    cls = 'critique';
  } else if (jrs <= 3) {
    msg = `⚠️ Abonnement expire dans ${jrs} jours.`;
    cls = 'alerte';
  } else {
    msg = `ℹ️ Abonnement expire dans ${jrs} jours.`;
    cls = 'attention';
  }
  banner.innerHTML = `
    <div style="background:${cls==='critique'?'#fee2e2':cls==='alerte'?'#fef3c7':'#eff6ff'};
                color:${cls==='critique'?'#991b1b':cls==='alerte'?'#92400e':'#1d4ed8'};
                padding:10px 16px;font-size:13px;font-weight:500;display:flex;
                align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span>${msg}</span>
      <a href="paiement.html"
         style="background:${cls==='critique'?'#ef4444':'#4338ca'};color:#fff;
                padding:5px 14px;border-radius:8px;text-decoration:none;
                font-size:12px;font-weight:600;white-space:nowrap">
        Renouveler →
      </a>
    </div>`;
  banner.style.display = 'block';
}

// ── Lancer au chargement ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!estPagePublique()) {
    window.appInitBoutique();
  }
});
