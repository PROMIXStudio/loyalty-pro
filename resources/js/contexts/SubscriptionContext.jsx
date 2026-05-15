import {
    createContext,
    useContext,
    useEffect,
    useState
}
from "react";

import {
    doc,
    onSnapshot
}
from "firebase/firestore";

import { db }
from "../firebase";

import { useAuth }
from "./AuthContext";

const SubscriptionContext =
    createContext(null);

export function SubscriptionProvider({
    children
}) {

    const {
        shopData,
        role
    } = useAuth();

    const [
        isBlocked,
        setIsBlocked
    ] = useState(false);

    const [
        daysLeft,
        setDaysLeft
    ] = useState(null);

    const [
        subStatus,
        setSubStatus
    ] = useState(null);

    useEffect(() => {

        if (
            !shopData?.id ||
            role === "admin"
        ) {

            setIsBlocked(false);
            return;
        }

        const unsubscribe =
            onSnapshot(

                doc(
                    db,
                    "shops",
                    shopData.id
                ),

                (snap) => {

                    if (!snap.exists())
                        return;

                    const data =
                        snap.data();

                    const endsAt =
                        data
                        .subscription_ends_at
                        ?.toDate?.()
                        ||
                        new Date(
                            data.subscription_ends_at
                        );

                    const now =
                        new Date();

                    const msLeft =
                        endsAt - now;

                    const days =
                        Math.ceil(
                            msLeft /
                            (
                                1000 *
                                60 *
                                60 *
                                24
                            )
                        );

                    setDaysLeft(days);

                    if (msLeft <= 0) {

                        setIsBlocked(true);

                        setSubStatus(
                            "expired"
                        );

                    } else if (days <= 1) {

                        setSubStatus(
                            "critical"
                        );

                        setIsBlocked(false);

                    } else if (days <= 3) {

                        setSubStatus(
                            "warning"
                        );

                        setIsBlocked(false);

                    } else {

                        setSubStatus(
                            data.subscription_status
                            || "active"
                        );

                        setIsBlocked(false);
                    }
                }
            );

        return () =>
            unsubscribe();

    }, [shopData, role]);

    return (

        <SubscriptionContext.Provider
            value={{
                isBlocked,
                daysLeft,
                subStatus
            }}
        >

            {children}

        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {

    return useContext(
        SubscriptionContext
    );
}
