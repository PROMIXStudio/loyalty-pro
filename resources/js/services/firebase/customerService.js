import {
    collection, addDoc, getDocs, doc, updateDoc,
    query, where, serverTimestamp, onSnapshot, getDoc
} from "firebase/firestore";
import { db } from "../../firebase";

export async function createCustomer({ shop_id, full_name, phone }) {
    const ref = await addDoc(collection(db, "customers"), {
        shop_id,
        full_name: full_name.trim(),
        phone: phone.trim(),
        total_points: 0,
        remaining_points: 0,
        created_at: serverTimestamp()
    });
    // Le QR sera généré depuis l'ID du doc
    return ref.id;
}

export async function getCustomers(shop_id) {
    const q = query(collection(db, "customers"), where("shop_id", "==", shop_id));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCustomer(customerId) {
    const d = await getDoc(doc(db, "customers", customerId));
    return d.exists() ? { id: d.id, ...d.data() } : null;
}

export function listenCustomers(shop_id, callback) {
    const q = query(collection(db, "customers"), where("shop_id", "==", shop_id));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

export async function addPointsToCustomer(customerId, pointsToAdd) {
    const cust = await getCustomer(customerId);
    await updateDoc(doc(db, "customers", customerId), {
        total_points: (cust.total_points || 0) + pointsToAdd,
        remaining_points: (cust.remaining_points || 0) + pointsToAdd
    });
}

export async function deductPointsFromCustomer(customerId, pointsToDeduct) {
    const cust = await getCustomer(customerId);
    const newRemaining = Math.max(0, (cust.remaining_points || 0) - pointsToDeduct);
    await updateDoc(doc(db, "customers", customerId), {
        remaining_points: newRemaining
    });
}

// Trouver un client par QR code "customerId|shopId"
export async function findCustomerByQR(qrValue) {
    const parts = qrValue.split("|");
    if (parts.length < 2) return null;
    const customerId = parts[0];
    const shopId = parts[1];
    const cust = await getCustomer(customerId);
    if (!cust || cust.shop_id !== shopId) return null;
    return cust;
}

export function getQRValue(customerId, shopId) {
    return `LOYALTY|${customerId}|${shopId}`;
}
