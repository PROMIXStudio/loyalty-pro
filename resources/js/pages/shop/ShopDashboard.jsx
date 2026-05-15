import { useEffect, useState } from "react";
import ShopLayout from "../../layouts/ShopLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getCustomers } from "../../services/firebase/customerService";
import { getTransactions } from "../../services/firebase/transactionService";

function StatCard({ icon, label, value, sub, color = "#3b82f6" }) {
    return (
        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <p style={{ color: "#71717a", fontSize: "13px", margin: "0 0 6px" }}>{label}</p>
                    <h2 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: 0 }}>{value}</h2>
                    {sub && <p style={{ color: "#52525b", fontSize: "12px", margin: "4px 0 0" }}>{sub}</p>}
                </div>
                <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px"
                }}>{icon}</div>
            </div>
        </div>
    );
}

export default function ShopDashboard() {
    const { shopData } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!shopData?.id) return;
        loadData();
    }, [shopData]);

    async function loadData() {
        const custs = await getCustomers(shopData.id);
        const txs = await getTransactions(shopData.id);
        setCustomers(custs);
        setTransactions(txs);
        setLoading(false);
    }

    const purchases = transactions.filter(t => t.type === "purchase");
    const exchanges = transactions.filter(t => t.type === "reward_exchange");
    const totalPointsAdded = purchases.reduce((s, t) => s + (t.points_added || 0), 0);
    const totalPointsUsed = exchanges.reduce((s, t) => s + (t.points_used || 0), 0);
    const totalRevenue = purchases.reduce((s, t) => s + (t.amount || 0), 0);

    // Top clients
    const topCustomers = [...customers]
        .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
        .slice(0, 5);

    // Activité récente
    const recentActivity = [...transactions]
        .sort((a, b) => {
            const da = a.created_at?.toDate?.() || new Date(0);
            const db2 = b.created_at?.toDate?.() || new Date(0);
            return db2 - da;
        })
        .slice(0, 6);

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    }

    return (
        <ShopLayout title="Dashboard" subtitle={`Bienvenue, ${shopData?.shop_name}`}>
            {loading ? (
                <div style={{ color: "#71717a", textAlign: "center", paddingTop: "60px" }}>Chargement...</div>
            ) : (
                <>
                    {/* Stats */}
                    <div style={{ display: "flex", gap: "14px", marginBottom: "24px", flexWrap: "wrap" }}>
                        <StatCard icon="👥" label="Clients fidèles" value={customers.length} color="#8b5cf6" />
                        <StatCard icon="⭐" label="Points collectés" value={totalPointsAdded.toLocaleString()} color="#f59e0b" />
                        <StatCard icon="🎁" label="Points échangés" value={totalPointsUsed.toLocaleString()} color="#22c55e" />
                        <StatCard icon="💰" label="CA total" value={`${totalRevenue.toLocaleString()} FCFA`} color="#3b82f6" />
                        <StatCard icon="🔄" label="Échanges" value={exchanges.length} color="#ec4899" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {/* Activité récente */}
                        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                            <div style={{ padding: "18px 20px", borderBottom: "1px solid #27272a" }}>
                                <h3 style={{ color: "white", margin: 0, fontSize: "15px", fontWeight: "600" }}>Activité récente</h3>
                            </div>
                            <div>
                                {recentActivity.length === 0 ? (
                                    <p style={{ color: "#52525b", padding: "20px", textAlign: "center" }}>Aucune activité</p>
                                ) : recentActivity.map(tx => {
                                    const cust = customers.find(c => c.id === tx.customer_id);
                                    const isPurchase = tx.type === "purchase";
                                    return (
                                        <div key={tx.id} style={{
                                            padding: "14px 20px", borderBottom: "1px solid #27272a",
                                            display: "flex", justifyContent: "space-between", alignItems: "center"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontSize: "18px" }}>{isPurchase ? "💳" : "🎁"}</span>
                                                <div>
                                                    <p style={{ color: "white", margin: 0, fontSize: "13px", fontWeight: "600" }}>
                                                        {cust?.full_name || "Client"}
                                                    </p>
                                                    <p style={{ color: "#71717a", margin: 0, fontSize: "12px" }}>
                                                        {isPurchase ? `${tx.amount?.toLocaleString()} FCFA` : tx.reward_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{
                                                    margin: 0, fontSize: "13px", fontWeight: "600",
                                                    color: isPurchase ? "#22c55e" : "#f59e0b"
                                                }}>
                                                    {isPurchase ? `+${tx.points_added} pts` : `-${tx.points_used} pts`}
                                                </p>
                                                <p style={{ color: "#52525b", margin: 0, fontSize: "11px" }}>{formatDate(tx.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top clients */}
                        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                            <div style={{ padding: "18px 20px", borderBottom: "1px solid #27272a" }}>
                                <h3 style={{ color: "white", margin: 0, fontSize: "15px", fontWeight: "600" }}>Top clients</h3>
                            </div>
                            <div>
                                {topCustomers.length === 0 ? (
                                    <p style={{ color: "#52525b", padding: "20px", textAlign: "center" }}>Aucun client</p>
                                ) : topCustomers.map((c, i) => (
                                    <div key={c.id} style={{
                                        padding: "14px 20px", borderBottom: "1px solid #27272a",
                                        display: "flex", justifyContent: "space-between", alignItems: "center"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{
                                                width: "28px", height: "28px", borderRadius: "50%",
                                                background: i === 0 ? "#f59e0b20" : i === 1 ? "#9ca3af20" : "#cd7f3220",
                                                color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#cd7f32",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "13px", fontWeight: "700"
                                            }}>#{i + 1}</span>
                                            <div>
                                                <p style={{ color: "white", margin: 0, fontSize: "13px", fontWeight: "600" }}>{c.full_name}</p>
                                                <p style={{ color: "#71717a", margin: 0, fontSize: "12px" }}>{c.phone}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ color: "#a78bfa", fontWeight: "700", margin: 0 }}>{c.total_points} pts</p>
                                            <p style={{ color: "#52525b", fontSize: "11px", margin: 0 }}>Restant: {c.remaining_points}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info système points */}
                    <div style={{
                        background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                        borderRadius: "14px", padding: "16px 20px", marginTop: "20px",
                        display: "flex", alignItems: "center", gap: "12px"
                    }}>
                        <span style={{ fontSize: "20px" }}>⚙️</span>
                        <p style={{ color: "#a78bfa", fontSize: "13px", margin: 0 }}>
                            Système de points : <strong>{shopData?.amount_step} FCFA</strong> = <strong>{shopData?.points_per_step} points</strong>
                        </p>
                    </div>
                </>
            )}
        </ShopLayout>
    );
}
