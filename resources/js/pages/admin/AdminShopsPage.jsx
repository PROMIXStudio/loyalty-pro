import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { listenShops, createShopWithUser, suspendShop, activateShop, CATEGORIES } from "../../services/firebase/shopService";
import { getCustomers } from "../../services/firebase/customerService";

function Input({ label, ...props }) {
    return (
        <div>
            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>{label}</label>
            <input {...props} style={{
                width: "100%", padding: "11px 14px", background: "#27272a",
                border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px",
                ...(props.style || {})
            }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#3f3f46"}
            />
        </div>
    );
}

function Select({ label, children, ...props }) {
    return (
        <div>
            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>{label}</label>
            <select {...props} style={{
                width: "100%", padding: "11px 14px", background: "#27272a",
                border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px"
            }}>
                {children}
            </select>
        </div>
    );
}

export default function AdminShopsPage() {
    const [shops, setShops] = useState([]);
    const [customerCounts, setCustomerCounts] = useState({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        shop_name: "", owner_name: "", category: CATEGORIES[0],
        email: "", password: "", phone: "", location: "",
        amount_step: 500, points_per_step: 5
    });
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = listenShops(async (data) => {
            setShops(data);
            // Compter clients par boutique
            const counts = {};
            for (const shop of data) {
                const customers = await getCustomers(shop.id);
                counts[shop.id] = customers.length;
            }
            setCustomerCounts(counts);
        });
        return () => unsub();
    }, []);

    function getStatusBadge(shop) {
        const ends = shop.subscription_ends_at?.toDate?.() || new Date(shop.subscription_ends_at || 0);
        const now = new Date();
        if (shop.subscription_status === "suspended") return { label: "Suspendu", color: "#ef4444" };
        if (ends <= now) return { label: "Expiré", color: "#f87171" };
        const days = (ends - now) / 86400000;
        if (days <= 1) return { label: "Critique", color: "#f97316" };
        if (days <= 3) return { label: "Attention", color: "#f59e0b" };
        if (shop.subscription_status === "trial") return { label: "Essai", color: "#a78bfa" };
        return { label: "Actif", color: "#22c55e" };
    }

    function filterShops() {
        return shops.filter(shop => {
            const s = search.toLowerCase();
            const matchSearch = !s || shop.shop_name?.toLowerCase().includes(s) ||
                shop.email?.toLowerCase().includes(s) || shop.phone?.includes(s);
            if (!matchSearch) return false;
            if (filter === "all") return true;
            const badge = getStatusBadge(shop);
            if (filter === "active") return badge.label === "Actif";
            if (filter === "trial") return badge.label === "Essai";
            if (filter === "suspended") return badge.label === "Suspendu";
            if (filter === "expired") return badge.label === "Expiré" || badge.label === "Critique";
            return true;
        });
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.shop_name || !form.email || !form.password) {
            setError("Nom boutique, email et mot de passe sont obligatoires.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await createShopWithUser(form);
            setShowModal(false);
            setForm({ shop_name: "", owner_name: "", category: CATEGORIES[0], email: "", password: "", phone: "", location: "", amount_step: 500, points_per_step: 5 });
        } catch (err) {
            setError(err.message || "Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    }

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    const filtered = filterShops();

    return (
        <AdminLayout title="Boutiques" subtitle={`${shops.length} boutique(s) enregistrée(s)`}>
            {/* Header actions */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, email, téléphone..."
                    style={{
                        flex: 1, minWidth: "200px", padding: "11px 16px", background: "#18181b",
                        border: "1px solid #27272a", borderRadius: "10px", color: "white", fontSize: "14px"
                    }} />
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{
                    padding: "11px 16px", background: "#18181b", border: "1px solid #27272a",
                    borderRadius: "10px", color: "white", fontSize: "14px"
                }}>
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="trial">En essai</option>
                    <option value="suspended">Suspendu</option>
                    <option value="expired">Expiré / Critique</option>
                </select>
                <button onClick={() => setShowModal(true)} style={{
                    padding: "11px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                }}>
                    + Ajouter boutique
                </button>
            </div>

            {/* Table */}
            <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#27272a" }}>
                            {["Boutique", "Catégorie", "Propriétaire", "Clients", "Statut", "Fin abonnement", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#71717a", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(shop => {
                            const badge = getStatusBadge(shop);
                            const isExpiredOrSuspended = badge.label === "Expiré" || badge.label === "Suspendu" || badge.label === "Critique";
                            return (
                                <tr key={shop.id} style={{ borderBottom: "1px solid #27272a" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#1f1f23"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <td style={{ padding: "14px 16px" }}>
                                        <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{shop.shop_name}</div>
                                        <div style={{ color: "#71717a", fontSize: "12px" }}>{shop.email}</div>
                                    </td>
                                    <td style={{ padding: "14px 16px", color: "#a1a1aa", fontSize: "13px" }}>{shop.category}</td>
                                    <td style={{ padding: "14px 16px", color: "#a1a1aa", fontSize: "13px" }}>{shop.phone}</td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{ color: "white", fontWeight: "600" }}>{customerCounts[shop.id] ?? "—"}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{
                                            background: `${badge.color}20`, color: badge.color,
                                            padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600"
                                        }}>{badge.label}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px", color: "#a1a1aa", fontSize: "12px" }}>
                                        {formatDate(shop.subscription_ends_at)}
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => navigate(`/admin/shops/${shop.id}`)} style={{
                                                background: "transparent", border: "1px solid #3f3f46",
                                                borderRadius: "8px", color: "#a1a1aa", padding: "5px 12px", fontSize: "12px"
                                            }}>Détails</button>
                                            {isExpiredOrSuspended ? (
                                                <button onClick={() => activateShop(shop.id, 30)} style={{
                                                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                                                    borderRadius: "8px", color: "#22c55e", padding: "5px 12px", fontSize: "12px"
                                                }}>Activer</button>
                                            ) : (
                                                <button onClick={() => suspendShop(shop.id)} style={{
                                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                                    borderRadius: "8px", color: "#f87171", padding: "5px 12px", fontSize: "12px"
                                                }}>Suspendre</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#52525b" }}>Aucune boutique trouvée</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal création */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
                }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div style={{
                        background: "#18181b", borderRadius: "20px", padding: "32px",
                        border: "1px solid #27272a", width: "100%", maxWidth: "600px",
                        maxHeight: "90vh", overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "700" }}>Ajouter une boutique</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#71717a", fontSize: "24px" }}>×</button>
                        </div>

                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#f87171", fontSize: "14px" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <Input label="Nom de la boutique *" value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} placeholder="ex: MPH SHOP" required />
                                <Input label="Nom du propriétaire" value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Nom complet" />
                                <Input label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@boutique.com" required />
                                <Input label="Mot de passe *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caractères" required />
                                <Input label="Téléphone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+237 6XX XXX XXX" />
                                <Input label="Localisation" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Yaoundé, Bastos..." />
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <Select label="Catégorie d'activité" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                            </div>

                            <div style={{ background: "#27272a", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                                <p style={{ color: "#a1a1aa", fontSize: "13px", margin: "0 0 12px", fontWeight: "600" }}>⚙️ Système de points</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "12px", display: "block", marginBottom: "6px" }}>Montant par palier (FCFA)</label>
                                        <input type="number" value={form.amount_step} onChange={e => setForm({ ...form, amount_step: Number(e.target.value) })}
                                            style={{ width: "100%", padding: "10px 14px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "white", fontSize: "14px" }} />
                                        <p style={{ color: "#52525b", fontSize: "11px", margin: "4px 0 0" }}>ex: 500 = chaque 500 FCFA</p>
                                    </div>
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "12px", display: "block", marginBottom: "6px" }}>Points par palier</label>
                                        <input type="number" value={form.points_per_step} onChange={e => setForm({ ...form, points_per_step: Number(e.target.value) })}
                                            style={{ width: "100%", padding: "10px 14px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "white", fontSize: "14px" }} />
                                        <p style={{ color: "#52525b", fontSize: "11px", margin: "4px 0 0" }}>ex: 5 = gagne 5 points</p>
                                    </div>
                                </div>
                                <p style={{ color: "#22c55e", fontSize: "12px", margin: "10px 0 0" }}>
                                    → Chaque {form.amount_step} FCFA = {form.points_per_step} points
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    flex: 1, padding: "12px", background: "transparent",
                                    border: "1px solid #3f3f46", borderRadius: "10px", color: "#a1a1aa", fontSize: "14px"
                                }}>Annuler</button>
                                <button type="submit" disabled={loading} style={{
                                    flex: 2, padding: "12px",
                                    background: loading ? "#1e3a8a" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                                }}>
                                    {loading ? "Création en cours..." : "Créer la boutique"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
