// ================================================================
// LOYALTY PRO - Categories d activites (Afrique) + recherche live
// ================================================================

const CATEGORIES = [
  "Alimentation generale","Supermarche / Epicerie","Boulangerie / Patisserie",
  "Boucherie / Charcuterie","Poissonnerie","Fruits et legumes","Boissons / Bar",
  "Restaurant","Fast-food / Street food","Cafe / Salon de the","Traiteur",
  "Mode et vetements","Chaussures","Accessoires de mode","Bijouterie / Joaillerie",
  "Cosmetiques / Beaute","Coiffure hommes","Coiffure femmes","Salon de beaute / Spa",
  "Parfumerie","Telephonie / GSM","Informatique / Materiel","Electronique",
  "Electromenager","Pharmacie","Clinique / Cabinet medical","Optique / Lunetterie",
  "Laboratoire d analyses","Kinesitherapie / Physio","Materiau de construction",
  "Quincaillerie","Menuiserie / Ameublement","Plomberie / Sanitaire",
  "Electricite / Electricien","Mobilier / Decoration","Artisanat local",
  "Librairie / Papeterie","Imprimerie / Reprographie","Agence de voyage / Tourisme",
  "Transport / Taxi","Moto-taxi / Bendskin","Location de vehicules",
  "Station-service / Carburant","Assurance","Banque / Microfinance",
  "Transfert d argent / Mobile Money","Agence immobiliere","Hotel / Auberge / Lodge",
  "Salon de fete / Event","Photographie / Videographie","Gym / Salle de sport",
  "Sport et loisirs","Jeux video / Cybercafe","Ecole / Centre de formation",
  "Garderie / Creche / Prescolaire","Veterinaire","Agriculture / Agrofourniture",
  "Semences / Engrais","Elevage","Peche / Pisciculture","Tissu / Wax / Pagne",
  "Couture / Tailleur","Pressing / Laverie","Mecanique auto / Moto",
  "Vente de pieces auto","Soudure / Ferronnerie","Peinture / Decoration interieure",
  "Jardinage / Paysagisme","Securite privee","Nettoyage / Entretien",
  "Evenementiel / Location materiel","Autre activite"
];

const Categories = {
  // Recherche en temps reel (insensible accents et casse)
  rechercher: (query) => {
    if (!query) return CATEGORIES;
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return CATEGORIES.filter(cat => {
      const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return c.includes(q);
    });
  },

  // Brancher recherche live sur un input + datalist ou liste deroulante
  initInput: (inputId, datalistId) => {
    const input    = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);
    if (!input || !datalist) return;
    const render = (cats) => {
      datalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
    };
    render(CATEGORIES);
    input.addEventListener('input', () => render(Categories.rechercher(input.value)));
  }
};