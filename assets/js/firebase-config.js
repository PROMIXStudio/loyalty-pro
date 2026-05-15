// ================================================================
// LOYALTY PRO - Configuration Firebase
// Remplacez les valeurs par vos vraies cles Firebase
// ================================================================
const firebaseConfig = {
  apiKey:            "AIzaSyADmq5-D2cFPvLTOeds0eQS0yC4aN2tJbI",
  authDomain:        "loyalty-pro-v2.firebaseapp.com",
  projectId:         "loyalty-pro-v2",
  storageBucket:     "loyalty-pro-v2.firebasestorage.app",
  messagingSenderId: "623791107984",
  appId:             "1:623791107984:web:9932da85f7abd05e0b8d15"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

// Noms des collections
const COLLECTIONS = {
  BOUTIQUES:      'boutiques',
  PROPRIETAIRES:  'proprietaires',
  GERANTS:        'gerants',
  ADMINS:         'admins',
  PAIEMENTS:      'paiements',
  NOTIFICATIONS:  'notifications'
};
