import {
    collection,
    addDoc
} from "firebase/firestore";

import { db } from "../../firebase";

const subscriptionCollection =
    collection(db, "subscriptions");

export async function createSubscription(data) {

    return await addDoc(subscriptionCollection, {

        shop_id: data.shop_id,

        status: "trial",

        started_at: new Date(),

        ends_at:
            new Date(
                Date.now() + 5 * 60 * 1000
            ),

        plan: "monthly",

        amount: 10000
    });
}
