import {
    collection,
    addDoc,
    getDocs
} from "firebase/firestore";

import { db } from "../../firebase";

const ownerCollection = collection(db, "owners");

export async function createOwner(data) {

    return await addDoc(ownerCollection, {

        full_name: data.full_name,

        email: data.email,

        phone: data.phone,

        status: "active",

        created_at: new Date()
    });
}

export async function getOwners() {

    const snapshot = await getDocs(ownerCollection);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
