// ================================================================
// LOYALTY PRO - Generation et affichage des QR codes clients
// ================================================================

const QRGen = {
  // Generer un QR code dans un element HTML
  generer: (elementId, clientId, boutiqueId) => {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    new QRCode(container, {
      text:         `LP:${boutiqueId}:${clientId}`,
      width:        200,
      height:       200,
      colorDark:    "#1e1b4b",
      colorLight:   "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  },

  // Telecharger le QR code en PNG
  telecharger: (elementId, nomClient) => {
    const canvas = document.querySelector(`#${elementId} canvas`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `fidelite-${nomClient.replace(/\s/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};