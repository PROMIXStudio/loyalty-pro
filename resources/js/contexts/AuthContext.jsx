import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // "admin" | "owner" | "manager"
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef(null);
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 min pour admin

    const logout = useCallback(async () => {
        await signOut(auth);
        setUser(null);
        setRole(null);
        setShopData(null);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            logout();
        }, INACTIVITY_LIMIT);
    }, [logout]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setRole(null);
                setShopData(null);
                setLoading(false);
                return;
            }

            // Vérifier si admin
            const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
            if (adminDoc.exists()) {
                setUser(firebaseUser);
                setRole("admin");
                setShopData(null);
                setLoading(false);
                // Inactivité pour admin
                const events = ["mousedown", "keydown", "touchstart", "scroll"];
                events.forEach(e => window.addEventListener(e, resetInactivityTimer));
                resetInactivityTimer();
                return () => events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            }

            // Vérifier shop_users
            const shopUsersQ = query(collection(db, "shop_users"), where("uid", "==", firebaseUser.uid));
            const shopUsersSnap = await getDocs(shopUsersQ);
            if (!shopUsersSnap.empty) {
                const shopUser = shopUsersSnap.docs[0].data();
                const shopDoc = await getDoc(doc(db, "shops", shopUser.shop_id));
                setUser(firebaseUser);
                setRole(shopUser.role);
                setShopData({ id: shopUser.shop_id, ...shopDoc.data(), shopUserId: shopUsersSnap.docs[0].id });
                setLoading(false);
                return;
            }

            // Utilisateur sans rôle
            setUser(firebaseUser);
            setRole(null);
            setShopData(null);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [resetInactivityTimer]);

    return (
        <AuthContext.Provider value={{ user, role, shopData, loading, logout, auth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
