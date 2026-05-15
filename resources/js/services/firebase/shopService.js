import {
    collection, addDoc, getDocs, doc, getDoc,
    updateDoc, query, where, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../firebase";

const CATEGORIES = [
    "Restaurant", "Salon de coiffure", "Boutique vêtements", "Pharmacie",
    "Épicerie / Supermarché", "Boulangerie / Pâtisserie", "Hôtel",
    "Bar / Lounge", "Café / Fast food", "Téléphonie / Électronique",
    "Bijouterie / Accessoires", "Librairie / Papeterie",
    "Laverie / Pressing", "Garage / Auto", "Transport",
    "Clinique / Cabinet médical", "Gym / Fitness", "Spa / Beauté",
    "Salle de jeux", "École / Formation", "Autre"
];

export { CATEGORIES };

export async function createShopWithUser({ shop_name, category, phone, email, password, location, amount_step, points_per_step, owner_name }) {
    // Créer le compte Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Durée abonnement : 5 minutes pour le test
    const endsAt = new Date(Date.now() + 5 * 60 * 1000);

    // Créer la boutique
    const shopRef = await addDoc(collection(db, "shops"), {
        shop_name: shop_name.trim(),
        shop_name_lower: shop_name.trim().toLowerCase(),
        owner_uid: uid,
        category,
        phone,
        email: email.toLowerCase(),
        location: location || "",
        amount_step: Number(amount_step) || 500,
        points_per_step: Number(points_per_step) || 5,
        subscription_status: "trial",
        subscription_ends_at: endsAt,
        created_at: serverTimestamp()
    });

    // Créer shop_user propriétaire
    await addDoc(collection(db, "shop_users"), {
        shop_id: shopRef.id,
        uid,
        email: email.toLowerCase(),
        name: owner_name || "",
        role: "owner",
        status: "active",
        created_at: serverTimestamp()
    });

    // Créer subscription doc
    await addDoc(collection(db, "subscriptions"), {
        shop_id: shopRef.id,
        status: "trial",
        started_at: new Date(),
        ends_at: endsAt,
        paid_at: null,
        plan: "monthly",
        amount: 0
    });

    // Créer settings doc
    await addDoc(collection(db, "settings"), {
        shop_id: shopRef.id,
        purchase_message: "Merci pour votre achat ! Vous avez gagné {points} points. Total : {total_points} points.",
        reward_message: "Félicitations ! Vous avez échangé {points_used} points contre : {reward_name}. Points restants : {remaining_points}.",
        whatsapp_enabled: true
    });

    return shopRef.id;
}

export async function getShops() {
    const snap = await getDocs(collection(db, "shops"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getShop(shopId) {
    const d = await getDoc(doc(db, "shops", shopId));
    return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function updateShop(shopId, data) {
    await updateDoc(doc(db, "shops", shopId), data);
}

export async function suspendShop(shopId) {
    await updateDoc(doc(db, "shops", shopId), { subscription_status: "suspended" });
}

export async function activateShop(shopId, daysToAdd = 30) {
    const endsAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, "shops", shopId), {
        subscription_status: "active",
        subscription_ends_at: endsAt
    });
    // Enregistrer dans subscriptions
    await addDoc(collection(db, "subscriptions"), {
        shop_id: shopId,
        status: "active",
        started_at: new Date(),
        ends_at: endsAt,
        paid_at: new Date(),
        plan: "monthly",
        amount: 10000
    });
}

export function listenShops(callback) {
    return onSnapshot(collection(db, "shops"), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}
