import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { getShops } from "../../services/firebase/shopService";

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [shops, setShops] = useState({});
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const shopsData = await getShops();
        const shopMap = {};
        shopsData.forEach(s => { shopMap[s.id] = s; });
        setShops(shopMap);

        const snap = await getDocs(collection(db, "subscriptions"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Tri par date décroissante
        data.sort((a, b) => {
            const da = a.paid_at?.toDate?.() || new Date(a.paid_at || 0);
            const db2 = b.paid_at?.toDate?.() || new Date(b.paid_at || 0);
            return db2 - da;
        });
        setSubscriptions(data);
    }

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    }

    const filtered = subscriptions.filter(sub => {
        if (!dateFrom && !dateTo) return true;
        const d = sub.paid_at?.toDate?.() || sub.started_at?.toDate?.() || new Date(sub.started_at || 0);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
        return true;
    });

    const totalRevenue = filtered.filter(s => s.amount > 0).reduce((sum, s) => sum + (s.amount || 0), 0);

    return (
        <AdminLayout title="Abonnements" subtitle="Historique des renouvellements">
            {/* Filtres date */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "flex-end" }}>
                <div>
                    <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Du</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        style={{ padding: "10px 14px", background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                </div>
                <div>
                    <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Au</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        style={{ padding: "10px 14px", background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                </div>
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{
                    padding: "10px 20px", background: "transparent", border: "1px solid #3f3f46",
                    borderRadius: "10px", color: "#a1a1aa", fontSize: "14px"
                }}>Réinitialiser</button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#18181b", borderRadius: "14px", border: "1px solid #27272a", padding: "20px", flex: 1 }}>
                    <p style={{ color: "#71717a", fontSize: "13px", margin: "0 0 6px" }}>Renouvellements</p>
                    <h2 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: 0 }}>{filtered.length}</h2>
                </div>
                <div style={{ background: "#18181b", borderRadius: "14px", border: "1px solid #27272a", padding: "20px", flex: 1 }}>
                    <p style={{ color: "#71717a", fontSize: "13px", margin: "0 0 6px" }}>Revenus période</p>
                    <h2 style={{ color: "#22c55e", fontSize: "28px", fontWeight: "700", margin: 0 }}>{totalRevenue.toLocaleString()} FCFA</h2>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#27272a" }}>
                            {["Boutique", "Plan", "Montant", "Statut", "Début", "Fin"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#71717a", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(sub => {
                            const shop = shops[sub.shop_id];
                            const statusColor = sub.status === "active" ? "#22c55e" : sub.status === "trial" ? "#a78bfa" : "#f87171";
                            return (
                                <tr key={sub.id} style={{ borderBottom: "1px solid #27272a" }}>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{shop?.shop_name || "—"}</div>
                                        <div style={{ color: "#71717a", fontSize: "12px" }}>{shop?.category || ""}</div>
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "#a1a1aa", fontSize: "13px" }}>{sub.plan || "monthly"}</td>
                                    <td style={{ padding: "12px 16px", color: sub.amount > 0 ? "#22c55e" : "#71717a", fontWeight: "600" }}>
                                        {sub.amount > 0 ? `${sub.amount.toLocaleString()} FCFA` : "Gratuit"}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{ background: `${statusColor}20`, color: statusColor, padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "#a1a1aa", fontSize: "13px" }}>{formatDate(sub.started_at)}</td>
                                    <td style={{ padding: "12px 16px", color: "#a1a1aa", fontSize: "13px" }}>{formatDate(sub.ends_at)}</td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#52525b" }}>Aucun abonnement pour cette période</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
