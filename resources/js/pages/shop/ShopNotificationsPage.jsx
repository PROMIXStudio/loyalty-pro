import { useEffect, useState } from "react";
import ShopLayout from "../../layouts/ShopLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, markNotificationRead } from "../../services/firebase/notificationService";
import { useSubscription } from "../../contexts/SubscriptionContext";

export default function ShopNotificationsPage() {
    const { shopData } = useAuth();
    const { daysLeft, subStatus } = useSubscription();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!shopData?.id) return;
        loadNotifications();
    }, [shopData]);

    async function loadNotifications() {
        const data = await getNotifications(shopData.id);
        data.sort((a, b) => {
            const da = a.created_at?.toDate?.() || new Date(0);
            const db2 = b.created_at?.toDate?.() || new Date(0);
            return db2 - da;
        });
        setNotifications(data);
        setLoading(false);
    }

    async function handleRead(notifId) {
        await markNotificationRead(notifId);
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    const typeIcons = { subscription: "📅", info: "ℹ️", warning: "⚠️", success: "✅", error: "❌" };

    return (
        <ShopLayout title="Notifications" subtitle={`${unreadCount > 0 ? `${unreadCount} non lue(s)` : "Tout lu"}`}>
            {/* Alerte abonnement */}
            {subStatus === "warning" && (
                <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
                    <p style={{ color: "#fb923c", fontWeight: "600", margin: "0 0 4px" }}>⚠️ Abonnement bientôt expiré</p>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>Votre abonnement expire dans {daysLeft} jours. Contactez l'administrateur pour renouveler.</p>
                </div>
            )}
            {subStatus === "critical" && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
                    <p style={{ color: "#f87171", fontWeight: "600", margin: "0 0 4px" }}>🚨 Abonnement critique !</p>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>Votre abonnement expire très bientôt. Renouvelez immédiatement pour éviter le blocage.</p>
                </div>
            )}

            {loading ? (
                <div style={{ color: "#71717a", textAlign: "center", paddingTop: "60px" }}>Chargement...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {notifications.length === 0 ? (
                        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "60px 40px", textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
                            <p style={{ color: "#52525b", fontSize: "16px" }}>Aucune notification</p>
                        </div>
                    ) : notifications.map(notif => (
                        <div key={notif.id} style={{
                            background: "#18181b",
                            borderRadius: "14px",
                            border: notif.read ? "1px solid #27272a" : "1px solid rgba(59,130,246,0.3)",
                            padding: "18px 20px",
                            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                            opacity: notif.read ? 0.7 : 1
                        }}>
                            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "24px" }}>{typeIcons[notif.type] || "🔔"}</span>
                                <div>
                                    <h4 style={{ color: "white", margin: "0 0 6px", fontSize: "15px", fontWeight: "600" }}>{notif.title}</h4>
                                    <p style={{ color: "#a1a1aa", margin: "0 0 8px", fontSize: "13px", lineHeight: "1.5" }}>{notif.message}</p>
                                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0 }}>{formatDate(notif.created_at)}</p>
                                </div>
                            </div>
                            {!notif.read && (
                                <button onClick={() => handleRead(notif.id)} style={{
                                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                                    borderRadius: "8px", color: "#60a5fa", padding: "6px 14px", fontSize: "12px", flexShrink: 0
                                }}>Marquer lu</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </ShopLayout>
    );
}
