// ================================================================
// LOYALTY PRO - Calcul et gestion des points (3 modes)
// ================================================================

const Points = {

  // Calculer les points selon le mode configure par la boutique
  calculer: (montant, config) => {
    if (!config || !montant) return 0;
    const m = parseFloat(montant);
    switch (config.mode) {
      case 'regle_de_trois':
        // montantRef unites = pointsRef pts => m unites = ? pts
        return Math.floor((m * config.pointsRef) / config.montantRef);
      case 'pourcentage':
        // X% du montant = points
        return Math.floor(m * config.pourcentage / 100);
      case 'fixe':
        // Toujours le meme nombre de points par achat
        return parseInt(config.pointsFixes);
      default:
        return 0;
    }
  },

  // Ajouter des points apres un achat (transaction atomique)
  ajouter: async (boutiqueId, clientId, pointsGagnes, infosTransaction) => {
    const clientRef = db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId)
                       .collection('clients').doc(clientId);
    return db.runTransaction(async (t) => {
      const snap = await t.get(clientRef);
      const d    = snap.data();
      const newCumul   = (d.pointsCumules  || 0) + pointsGagnes;
      const newRestant = (d.pointsRestants || 0) + pointsGagnes;
      t.update(clientRef, { pointsCumules: newCumul, pointsRestants: newRestant });
      const txRef = clientRef.collection('transactions').doc();
      t.set(txRef, {
        ...infosTransaction,
        points: pointsGagnes,
        type:   'achat',
        date:   firebase.firestore.FieldValue.serverTimestamp()
      });
      return { pointsCumules: newCumul, pointsRestants: newRestant };
    });
  },

  // Deduire des points lors d un echange
  echanger: async (boutiqueId, clientId, pointsADeduire, infosTransaction) => {
    const clientRef = db.collection(COLLECTIONS.BOUTIQUES).doc(boutiqueId)
                       .collection('clients').doc(clientId);
    return db.runTransaction(async (t) => {
      const snap    = await t.get(clientRef);
      const d       = snap.data();
      const restant = d.pointsRestants || 0;
      if (restant < pointsADeduire) throw new Error('Points insuffisants');
      const newRestant = restant - pointsADeduire;
      const newEchanges = (d.pointsEchanges || 0) + pointsADeduire;
      t.update(clientRef, { pointsRestants: newRestant, pointsEchanges: newEchanges });
      const txRef = clientRef.collection('transactions').doc();
      t.set(txRef, {
        ...infosTransaction,
        points: -pointsADeduire,
        type:   'echange',
        date:   firebase.firestore.FieldValue.serverTimestamp()
      });
      return { pointsRestants: newRestant, pointsEchanges: newEchanges };
    });
  }
};