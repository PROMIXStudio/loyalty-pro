// ================================================================
// LOYALTY PRO - Gestion des abonnements en temps reel
// ================================================================

const Subscription = {

  DUREES: {
    TEST_5MIN:  5 * 60 * 1000,
    TEST_30MIN: 30 * 60 * 1000,
    TEST_1H:    60 * 60 * 1000,
    TEST_1JOUR: 24 * 60 * 60 * 1000,
    MENSUEL:    30 * 24 * 60 * 60 * 1000,
    TRIMESTRIEL: 90 * 24 * 60 * 60 * 1000,
    ANNUEL:     365 * 24 * 60 * 60 * 1000
  },

  // Verifier le statut d une boutique
  check: async (boutiqueId) => {
    const snap = await db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId).get();
    if (!snap.exists) return { actif: false, statut: 'inexistant', jours: 0 };
    const data = snap.data();
    const now  = Date.now();
    const fin  = data.abonnement?.fin?.toMillis?.() || 0;
    const diff = fin - now;
    const min  = Math.ceil(diff / 60000);
    const jours = Math.ceil(diff / 86400000);

    if (diff <= 0)     return { actif: false, statut: 'expire',    jours: 0, min: 0 };
    if (jours <= 1)    return { actif: true,  statut: 'critique',  jours: 1, min };
    if (jours <= 3)    return { actif: true,  statut: 'alerte',    jours, min };
    if (jours <= 5)    return { actif: true,  statut: 'attention', jours, min };
    return               { actif: true,  statut: 'actif',     jours, min };
  },

  // Surveillance temps reel : appelle onExpire si abonnement expire
  watch: (boutiqueId, onExpire, onAlert) => {
    return db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId)
      .onSnapshot(snap => {
        if (!snap.exists) return;
        const fin = snap.data().abonnement?.fin?.toMillis?.() || 0;
        if (Date.now() >= fin) {
          onExpire();
        } else {
          const jours = Math.ceil((fin - Date.now()) / 86400000);
          if (onAlert && jours <= 5) onAlert(jours);
        }
      });
  },

  // Activer ou renouveler un abonnement
  activer: async (boutiqueId, dureeMs) => {
    const now = new Date();
    const fin = new Date(Date.now() + dureeMs);
    await db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId).update({
      'abonnement.debut': firebase.firestore.Timestamp.fromDate(now),
      'abonnement.fin':   firebase.firestore.Timestamp.fromDate(fin),
      'abonnement.actif': true,
      statut: 'actif'
    });
  },

  // Mode test : duree personnalisee en minutes
  setTestMode: async (boutiqueId, dureeMinutes) => {
    await Subscription.activer(boutiqueId, dureeMinutes * 60 * 1000);
    await db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId).update({
      'testMode.actif':        true,
      'testMode.dureeMinutes': dureeMinutes
    });
  },

  // Suspendre manuellement
  suspendre: async (boutiqueId) => {
    await db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId).update({
      'abonnement.actif': false,
      statut: 'suspendu'
    });
  },

  // Guard global : bloquer toute page boutique si abonnement expire
  guard: async () => {
    const boutiqueId = sessionStorage.getItem('boutiqueId');
    if (!boutiqueId) return;
    const status = await Subscription.check(boutiqueId);
    if (!status.actif) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    min-height:100vh;background:#f0f4ff;font-family:sans-serif;">
          <div style="background:#fff;border-radius:16px;padding:2rem 2.5rem;
                      text-align:center;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
            <div style="font-size:3.5rem;margin-bottom:1rem">ðŸ”’</div>
            <h2 style="color:#1e1b4b;font-size:1.4rem;margin-bottom:0.5rem">
              Abonnement expire
            </h2>
            <p style="color:#6b7280;margin-bottom:1.5rem;line-height:1.6">
              Votre abonnement est termine. Renouvelez-le pour continuer a utiliser Loyalty Pro.
            </p>
            <a href="/app/paiement.html"
               style="display:inline-block;background:#4f46e5;color:#fff;
                      padding:0.75rem 2rem;border-radius:10px;text-decoration:none;
                      font-weight:600;margin-bottom:0.75rem">
              Renouveler maintenant
            </a><br>
            <a href="/app/index.html"
               style="font-size:13px;color:#6b7280;text-decoration:none">
              Se reconnecter
            </a>
          </div>
        </div>`;
      throw new Error('Abonnement expire');
    }
  }
};