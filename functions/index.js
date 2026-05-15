// ================================================================
// LOYALTY PRO - Firebase Cloud Function : Webhook Monetbil
// Fichier : functions/index.js
// Déployez avec : firebase deploy --only functions
// ================================================================

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const MONETBIL_SERVICE_SECRET = 'ZuqkRBQZ9v1QNAVhDUBUcELccS7GgXXVeFfoJNe8VEt0abFjmFxUamDx2S9Kkat9';

// ── Webhook appelé automatiquement par Monetbil après paiement ─
exports.monetbilWebhook = functions.https.onRequest(async (req, res) => {
  console.log('Webhook Monetbil reçu:', req.body);

  const {
    service_key, payment_ref, transaction_id,
    phonenumber, amount, status, operator
  } = req.body;

  // Vérifier la clé service
  if (service_key !== 'A3o1h9uoTzRWGkPxnSMHuJ9TmpbSX3o5') {
    console.error('Service key invalide');
    return res.status(403).send('Forbidden');
  }

  if (status !== '1' && status !== 'success') {
    console.log('Paiement non réussi, status:', status);
    return res.status(200).send('OK');
  }

  try {
    // Extraire l'ID boutique depuis payment_ref (format: LP-boutiqueId-Xmois-timestamp)
    const parts     = (payment_ref || '').split('-');
    const boutiqueId = parts[1] || '';

    if (!boutiqueId) {
      console.error('BoutiqueId non trouvé dans payment_ref:', payment_ref);
      return res.status(400).send('BoutiqueId manquant');
    }

    // Trouver le paiement dans Firestore
    const pSnap = await db.collection('paiements')
      .where('reference', '==', payment_ref).limit(1).get();

    let dureeMs = 2592000000; // 1 mois par défaut
    let mois    = 1;

    if (!pSnap.empty) {
      const pData = pSnap.docs[0].data();
      dureeMs = pData.dureeMs || dureeMs;
      mois    = pData.mois    || mois;

      // Mettre à jour le statut du paiement
      await pSnap.docs[0].ref.update({
        statut:        'SUCCESSFUL',
        transaction_id,
        operateur:     operator || 'Mobile Money',
        montantRecu:   parseInt(amount) || 0
      });
    } else {
      // Créer le paiement s'il n'existe pas
      await db.collection('paiements').add({
        boutiqueId, phonenumber,
        montant:      parseInt(amount) || 0,
        reference:    payment_ref,
        transaction_id,
        operateur:    operator || 'Mobile Money',
        statut:       'SUCCESSFUL',
        modePaiement: 'MONETBIL',
        date:         admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Activer l'abonnement
    const now = Date.now();
    const fin = new Date(now + dureeMs);

    await db.collection('boutiques').doc(boutiqueId).update({
      statut:               'actif',
      'abonnement.actif':   true,
      'abonnement.debut':   admin.firestore.Timestamp.fromDate(new Date(now)),
      'abonnement.fin':     admin.firestore.Timestamp.fromDate(fin),
      'abonnement.dureeMs': dureeMs
    });

    console.log('Abonnement activé pour boutique:', boutiqueId, '- Expire:', fin);
    return res.status(200).send('OK');

  } catch(e) {
    console.error('Erreur webhook:', e);
    return res.status(500).send('Erreur');
  }
});
