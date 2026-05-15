import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { addPointsToCustomer, deductPointsFromCustomer } from "./customerService";

export function calculatePoints(amount, amount_step, points_per_step) {
    if (!amount_step || amount_step <= 0) return 0;
    return Math.floor(amount / amount_step) * points_per_step;
}

export async function recordPurchase({ shop_id, customer_id, amount, description, amount_step, points_per_step }) {
    const points = calculatePoints(amount, amount_step, points_per_step);

    await addDoc(collection(db, "transactions"), {
        shop_id,
        customer_id,
        type: "purchase",
        amount: Number(amount),
        points_added: points,
        points_used: 0,
        reward_name: null,
        description: description || "",
        created_at: serverTimestamp()
    });

    await addPointsToCustomer(customer_id, points);
    return points;
}

export async function recordRewardExchange({ shop_id, customer_id, points_used, reward_name }) {
    await addDoc(collection(db, "transactions"), {
        shop_id,
        customer_id,
        type: "reward_exchange",
        amount: 0,
        points_added: 0,
        points_used: Number(points_used),
        reward_name: reward_name || "",
        description: `Échange : ${reward_name}`,
        created_at: serverTimestamp()
    });

    await deductPointsFromCustomer(customer_id, Number(points_used));
}

export async function getTransactions(shop_id) {
    const q = query(collection(db, "transactions"), where("shop_id", "==", shop_id));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCustomerTransactions(customer_id) {
    const q = query(collection(db, "transactions"), where("customer_id", "==", customer_id));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
