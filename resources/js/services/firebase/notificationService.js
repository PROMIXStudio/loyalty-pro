import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export async function sendNotification({ shop_id, title, message, type = "info", channel = "app" }) {
    await addDoc(collection(db, "notifications"), {
        shop_id,
        title,
        message,
        type,
        channel,
        read: false,
        created_at: serverTimestamp()
    });
}

export async function sendBroadcastNotification(shop_ids, { title, message, type = "info", channel = "app" }) {
    for (const shop_id of shop_ids) {
        await sendNotification({ shop_id, title, message, type, channel });
    }
}

export async function getNotifications(shop_id) {
    const q = query(collection(db, "notifications"), where("shop_id", "==", shop_id));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markNotificationRead(notifId) {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
}

export function buildWhatsAppMessage(template, vars) {
    let msg = template;
    Object.entries(vars).forEach(([key, val]) => {
        msg = msg.replaceAll(`{${key}}`, val);
    });
    return msg;
}

export function openWhatsApp(phone, message) {
    const clean = phone.replace(/[^0-9+]/g, "");
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
}
