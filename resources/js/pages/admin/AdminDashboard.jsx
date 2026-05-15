import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { listenShops } from "../../services/firebase/shopService";
import { getTransactions } from "../../services/firebase/transactionService";
import { useNavigate } from "react-router-dom";

function StatCard({ icon, label, value, color = "#3b82f6", sub }) {
    return (
        <div style={{
            background: "#18181b", borderRadius: "16px", padding: "24px",
            border: "1px solid #27272a", flex: 1
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <p style={{ color: "#71717a", fontSize: "13px", margin: "0 0 8px" }}>{label}</p>
                    <h2 style={{ color: "white", fontSize: "32px", fontWeight: "700", margin: 0 }}>{value}</h2>
                    {sub && <p style={{ color: "#52525b", fontSize: "12px", margin: "6px 0 0" }}>{sub}</p>}
                </div>
                <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px"
                }}>{icon}</div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [shops, setShops] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = listenShops(setShops);
        return () => unsub();
    }, []);

    const now = new Date();
    const activeShops = shops.filter(s => {
        const ends = s.subscription_ends_at?.toDate?.() || new Date(s.subscription_ends_at || 0);
        return ends > now && s.subscription_status !== "suspended";
    });
    const trialShops = shops.filter(s => s.subscription_status === "trial");
    const suspendedShops = shops.filter(s => s.subscription_status === "suspended");
    const expiredShops = shops.filter(s => {
        const ends = s.subscription_ends_at?.toDate?.() || new Date(s.subscription_ends_at || 0);
        return ends <= now && s.subscription_status !== "suspended";
    });

    // Renouvellements à venir dans 7 jours
    const renewingSoon = shops.filter(s => {
        const ends = s.subscription_ends_at?.toDate?.() || new Date(s.subscription_ends_at || 0);
        const diff = (ends - now) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 7;
    });

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function getStatusBadge(shop) {
        const ends = shop.subscription_ends_at?.toDate?.() || new Date(shop.subscription_ends_at || 0);
        const now = new Date();
        if (shop.subscription_status === "suspended") return { label: "Suspendu", color: "#ef4444" };
        if (ends <= now) return { label: "Expiré", color: "#f87171" };
        const days = (ends - now) / (1000 * 60 * 60 * 24);
        if (days <= 1) return { label: "Critique", color: "#f97316" };
        if (days <= 3) return { label: "Attention", color: "#f59e0b" };
        if (shop.subscription_status === "trial") return { label: "Essai", color: "#a78bfa" };
        return { label: "Actif", color: "#22c55e" };
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Vue d'ensemble de votre plateforme">
            {/* Stats */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                <StatCard icon="🏪" label="Total boutiques" value={shops.length} color="#3b82f6" />
                <StatCard icon="✅" label="Actives" value={activeShops.length} color="#22c55e" />
                <StatCard icon="🧪" label="En essai" value={trialShops.length} color="#a78bfa" />
                <StatCard icon="⏸️" label="Suspendues" value={suspendedShops.length} color="#f87171" />
                <StatCard icon="⚠️" label="Expiré / Critique" value={expiredShops.length + shops.filter(s => { const e = s.subscription_ends_at?.toDate?.() || new Date(s.subscription_ends_at || 0); const d = (e - now) / 86400000; return d > 0 && d <= 1; }).length} color="#f59e0b" />
            </div>

            {/* Renouvellements à venir */}
            {renewingSoon.length > 0 && (
                <div style={{
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "14px", padding: "16px 20px", marginBottom: "24px"
                }}>
                    <p style={{ color: "#f59e0b", fontWeight: "600", margin: "0 0 8px", fontSize: "14px" }}>
                        ⚠️ {renewingSoon.length} boutique(s) à renouveler dans les 7 prochains jours
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {renewingSoon.map(s => (
                            <span key={s.id} style={{
                                background: "rgba(245,158,11,0.15)", color: "#fbbf24",
                                padding: "4px 12px", borderRadius: "999px", fontSize: "13px"
                            }}>{s.shop_name}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Table boutiques récentes */}
            <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: "white", margin: 0, fontSize: "16px", fontWeight: "600" }}>Boutiques récentes</h3>
                    <button onClick={() => navigate("/admin/shops")} style={{
                        background: "transparent", border: "1px solid #3f3f46", borderRadius: "8px",
                        color: "#a1a1aa", padding: "6px 16px", fontSize: "13px"
                    }}>Voir tout</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#27272a" }}>
                            {["Boutique", "Catégorie", "Statut", "Fin d'abonnement", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 20px", textAlign: "left", color: "#71717a", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shops.slice(0, 8).map(shop => {
                            const badge = getStatusBadge(shop);
                            return (
                                <tr key={shop.id} style={{ borderBottom: "1px solid #27272a" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#1f1f23"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{shop.shop_name}</div>
                                        <div style={{ color: "#71717a", fontSize: "12px" }}>{shop.email}</div>
                                    </td>
                                    <td style={{ padding: "14px 20px", color: "#a1a1aa", fontSize: "14px" }}>{shop.category}</td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{
                                            background: `${badge.color}20`, color: badge.color,
                                            padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600"
                                        }}>{badge.label}</span>
                                    </td>
                                    <td style={{ padding: "14px 20px", color: "#a1a1aa", fontSize: "13px" }}>
                                        {formatDate(shop.subscription_ends_at)}
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <button onClick={() => navigate(`/admin/shops/${shop.id}`)} style={{
                                            background: "transparent", border: "1px solid #3f3f46",
                                            borderRadius: "8px", color: "#a1a1aa", padding: "6px 14px", fontSize: "12px"
                                        }}>Détails</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {shops.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#52525b" }}>
                                    Aucune boutique enregistrée
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
