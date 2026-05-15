// ================================================================
// LOYALTY PRO - Messages WhatsApp automatiques
// ================================================================

const WhatsApp = {

  // Ouvrir WhatsApp avec message pre-rempli
  envoyer: (telephone, message) => {
    const tel = String(telephone).replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  // Remplacer les variables {{nom}} dans un template
  compiler: (template, vars) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? ''),

  // Templates par defaut (modifiables en Parametres)
  TEMPLATES: {
    bienvenue: `Bonjour {{nomClient}} ! ðŸŽ‰\n\nBienvenue parmi les clients fideles de *{{nomBoutique}}* !\n\nVotre carte de fidelite est activee. A chaque achat, vous cumulez des points echangeables contre des produits gratuits.\n\nVenez nous rendre visite et commencez a gagner des points des aujourd'hui ! ðŸ›ï¸\n\nMerci de votre confiance. ðŸ™`,

    achat: `Bonjour {{nomClient}} ! âœ…\n\n*{{nomBoutique}}* confirme votre achat.\n\nðŸ›’ Montant : {{montant}} FCFA\nâ­ Points gagnes : +{{pointsGagnes}} pts\nðŸ“Š Total cumule : {{pointsCumules}} pts\nðŸ’° Points restants : {{pointsRestants}} pts\n\nMerci pour votre visite ! A bientot ðŸ˜Š`,

    echange: `Bonjour {{nomClient}} ! ðŸŽ\n\n*{{nomBoutique}}* confirme votre echange de points.\n\nðŸŽ Produit obtenu : {{produit}}\nâž– Points utilises : {{pointsDeduits}} pts\nðŸ’° Points restants : {{pointsRestants}} pts\n\nProfitez bien de votre recompense ! ðŸ¥³`,

    promo: `Bonjour {{nomClient}} ! ðŸ“¢\n\n*{{nomBoutique}}* a une offre speciale pour vous :\n\n{{messagePromo}}\n\nA tres bientot ! ðŸ˜Š`,

    paiement_ok: `âœ… Abonnement renouvele avec succes !\n\nBoutique : *{{nomBoutique}}*\nMontant : {{montant}} FCFA\nValide jusqu au : {{dateFin}}\n\nMerci pour votre confiance. â€” Loyalty Pro`,

    paiement_echec: `âŒ Echec du paiement\n\nBoutique : *{{nomBoutique}}*\nMontant : {{montant}} FCFA\n\nVeuillez reessayer ou contacter le support Loyalty Pro.`
  },

  bienvenue:    (client, boutique, tpl) => WhatsApp.envoyer(client.telephone,
    WhatsApp.compiler(tpl || WhatsApp.TEMPLATES.bienvenue, { nomClient: client.nom, nomBoutique: boutique.nom })),

  confirmAchat: (client, boutique, achat, tpl) => WhatsApp.envoyer(client.telephone,
    WhatsApp.compiler(tpl || WhatsApp.TEMPLATES.achat, {
      nomClient: client.nom, nomBoutique: boutique.nom,
      montant: achat.montant, pointsGagnes: achat.pointsGagnes,
      pointsCumules: client.pointsCumules, pointsRestants: client.pointsRestants
    })),

  confirmEchange: (client, boutique, echange, tpl) => WhatsApp.envoyer(client.telephone,
    WhatsApp.compiler(tpl || WhatsApp.TEMPLATES.echange, {
      nomClient: client.nom, nomBoutique: boutique.nom,
      produit: echange.produit, pointsDeduits: echange.pointsDeduits,
      pointsRestants: client.pointsRestants
    }))
};