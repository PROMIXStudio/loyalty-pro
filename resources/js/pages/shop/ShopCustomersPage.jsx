import { useEffect, useState, useRef } from "react";
import ShopLayout from "../../layouts/ShopLayout";
import { useAuth } from "../../contexts/AuthContext";
import { listenCustomers, createCustomer, getCustomer, getQRValue } from "../../services/firebase/customerService";
import { recordPurchase, recordRewardExchange, calculatePoints } from "../../services/firebase/transactionService";
import { getCustomerTransactions } from "../../services/firebase/transactionService";
import { openWhatsApp, buildWhatsAppMessage } from "../../services/firebase/notificationService";
import { getDocs, query, collection, where } from "firebase/firestore";
import { db } from "../../firebase";
import QRCode from "qrcode";

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                background: "#18181b", borderRadius: "20px", padding: "28px",
                border: "1px solid #27272a", width: "100%", maxWidth: "520px",
                maxHeight: "90vh", overflowY: "auto"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ color: "white", margin: 0, fontSize: "18px", fontWeight: "700" }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717a", fontSize: "24px" }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function ShopCustomersPage() {
    const { shopData } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [addModal, setAddModal] = useState(false);
    const [qrModal, setQrModal] = useState(null); // customer
    const [actionModal, setActionModal] = useState(null); // customer
    const [actionTab, setActionTab] = useState("purchase");
    const [form, setForm] = useState({ full_name: "", phone: "" });
    const [actionForm, setActionForm] = useState({ amount: "", description: "", points_used: "", reward_name: "" });
    const [loading, setLoading] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (!shopData?.id) return;
        const unsub = listenCustomers(shopData.id, setCustomers);
        loadSettings();
        return () => unsub();
    }, [shopData]);

    async function loadSettings() {
        const snap = await getDocs(query(collection(db, "settings"), where("shop_id", "==", shopData.id)));
        if (!snap.empty) setSettings(snap.docs[0].data());
    }

    async function openQrModal(customer) {
        const qrValue = getQRValue(customer.id, shopData.id);
        const url = await QRCode.toDataURL(qrValue, { width: 250, margin: 2, color: { dark: "#ffffff", light: "#18181b" } });
        setQrDataUrl(url);
        setQrModal(customer);
    }

    async function openActionModal(customer) {
        setActionModal(customer);
        setActionTab("purchase");
        setActionForm({ amount: "", description: "", points_used: "", reward_name: "" });
        const txs = await getCustomerTransactions(customer.id);
        setTransactions(txs.sort((a, b) => {
            const da = a.created_at?.toDate?.() || new Date(0);
            const db2 = b.created_at?.toDate?.() || new Date(0);
            return db2 - da;
        }));
    }

    async function handleAddCustomer(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await createCustomer({ shop_id: shopData.id, ...form });
            setAddModal(false);
            setForm({ full_name: "", phone: "" });
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchase(e) {
        e.preventDefault();
        if (!actionModal) return;
        setLoading(true);
        try {
            const pts = await recordPurchase({
                shop_id: shopData.id,
                customer_id: actionModal.id,
                amount: Number(actionForm.amount),
                description: actionForm.description,
                amount_step: shopData.amount_step,
                points_per_step: shopData.points_per_step
            });

            // Refresh customer
            const updated = await getCustomer(actionModal.id);

            // WhatsApp auto
            if (settings?.whatsapp_enabled && actionModal.phone) {
                const msg = buildWhatsAppMessage(
                    settings.purchase_message || "Merci {full_name} ! Vous avez gagné {points} points. Total : {total_points} pts.",
                    {
                        full_name: actionModal.full_name,
                        points: pts,
                        total_points: updated?.total_points || 0,
                        remaining_points: updated?.remaining_points || 0,
                        shop_name: shopData.shop_name,
                        amount: actionForm.amount
                    }
                );
                openWhatsApp(actionModal.phone, msg);
            }

            setActionModal(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleExchange(e) {
        e.preventDefault();
        if (!actionModal) return;
        if (Number(actionForm.points_used) > actionModal.remaining_points) {
            alert("Points insuffisants !");
            return;
        }
        setLoading(true);
        try {
            await recordRewardExchange({
                shop_id: shopData.id,
                customer_id: actionModal.id,
                points_used: Number(actionForm.points_used),
                reward_name: actionForm.reward_name
            });

            const updated = await getCustomer(actionModal.id);

            if (settings?.whatsapp_enabled && actionModal.phone) {
                const msg = buildWhatsAppMessage(
                    settings.reward_message || "Félicitations {full_name} ! Vous avez échangé {points_used} points contre : {reward_name}. Points restants : {remaining_points}.",
                    {
                        full_name: actionModal.full_name,
                        points_used: actionForm.points_used,
                        reward_name: actionForm.reward_name,
                        remaining_points: updated?.remaining_points || 0,
                        shop_name: shopData.shop_name
                    }
                );
                openWhatsApp(actionModal.phone, msg);
            }

            setActionModal(null);
        } finally {
            setLoading(false);
        }
    }

    const filtered = customers.filter(c =>
        !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    );

    const pointsPreview = actionForm.amount
        ? calculatePoints(Number(actionForm.amount), shopData?.amount_step, shopData?.points_per_step)
        : 0;

    function formatDate(ts) {
        if (!ts) return "—";
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    }

    return (
        <ShopLayout title="Clients fidèles" subtitle={`${customers.length} client(s) enregistré(s)`}>
            {/* Actions bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou téléphone..."
                    style={{ flex: 1, padding: "11px 16px", background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                <button onClick={() => setAddModal(true)} style={{
                    padding: "11px 20px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                }}>+ Ajouter client</button>
            </div>

            {/* Table */}
            <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#27272a" }}>
                            {["Nom", "Téléphone", "Points totaux", "Points restants", "Actions"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#71717a", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid #27272a" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#1f1f23"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <td style={{ padding: "14px 16px" }}>
                                    <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{c.full_name}</div>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <button onClick={() => openWhatsApp(c.phone, `Bonjour ${c.full_name} !`)} style={{
                                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                                        borderRadius: "8px", color: "#22c55e", padding: "4px 12px", fontSize: "13px"
                                    }}>💬 {c.phone}</button>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{ color: "#a78bfa", fontWeight: "700", fontSize: "15px" }}>{c.total_points}</span>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{ color: "#22c55e", fontWeight: "700", fontSize: "15px" }}>{c.remaining_points}</span>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button onClick={() => openQrModal(c)} style={{
                                            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                                            borderRadius: "8px", color: "#a78bfa", padding: "6px 12px", fontSize: "12px"
                                        }}>📷 QR</button>
                                        <button onClick={() => openActionModal(c)} style={{
                                            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                                            borderRadius: "8px", color: "#60a5fa", padding: "6px 12px", fontSize: "12px"
                                        }}>⚡ Action</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#52525b" }}>
                                {search ? "Aucun client trouvé" : "Aucun client enregistré"}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal ajout client */}
            <Modal open={addModal} onClose={() => setAddModal(false)} title="Ajouter un client">
                <form onSubmit={handleAddCustomer}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Nom complet *</label>
                            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required
                                placeholder="Jean Dupont"
                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                        </div>
                        <div>
                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Numéro WhatsApp *</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                                placeholder="+237 6XX XXX XXX"
                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                        </div>
                        <p style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
                            ✅ Le QR code sera généré automatiquement après l'enregistrement
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button type="button" onClick={() => setAddModal(false)} style={{
                                flex: 1, padding: "11px", background: "transparent", border: "1px solid #3f3f46",
                                borderRadius: "10px", color: "#a1a1aa", fontSize: "14px"
                            }}>Annuler</button>
                            <button type="submit" disabled={loading} style={{
                                flex: 2, padding: "11px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                            }}>{loading ? "Enregistrement..." : "Ajouter le client"}</button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal QR */}
            <Modal open={!!qrModal} onClose={() => setQrModal(null)} title="Code QR client">
                {qrModal && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ background: "#18181b", display: "inline-block", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
                            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: "220px", height: "220px" }} />}
                        </div>
                        <h3 style={{ color: "white", margin: "0 0 4px" }}>{qrModal.full_name}</h3>
                        <p style={{ color: "#71717a", margin: "0 0 16px" }}>{qrModal.phone}</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <div style={{ background: "#27272a", borderRadius: "10px", padding: "12px 20px" }}>
                                <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points totaux</p>
                                <p style={{ color: "#a78bfa", fontWeight: "700", margin: 0 }}>{qrModal.total_points}</p>
                            </div>
                            <div style={{ background: "#27272a", borderRadius: "10px", padding: "12px 20px" }}>
                                <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points restants</p>
                                <p style={{ color: "#22c55e", fontWeight: "700", margin: 0 }}>{qrModal.remaining_points}</p>
                            </div>
                        </div>
                        <button onClick={() => {
                            const a = document.createElement("a");
                            a.href = qrDataUrl;
                            a.download = `qr-${qrModal.full_name}.png`;
                            a.click();
                        }} style={{
                            marginTop: "16px", padding: "11px 24px",
                            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                        }}>⬇️ Télécharger</button>
                    </div>
                )}
            </Modal>

            {/* Modal action */}
            <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={`Action — ${actionModal?.full_name}`}>
                {actionModal && (
                    <div>
                        {/* Points */}
                        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                            <div style={{ background: "#27272a", borderRadius: "10px", padding: "12px 16px", flex: 1 }}>
                                <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points totaux</p>
                                <p style={{ color: "#a78bfa", fontWeight: "700", margin: 0 }}>{actionModal.total_points}</p>
                            </div>
                            <div style={{ background: "#27272a", borderRadius: "10px", padding: "12px 16px", flex: 1 }}>
                                <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points restants</p>
                                <p style={{ color: "#22c55e", fontWeight: "700", margin: 0 }}>{actionModal.remaining_points}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", background: "#27272a", padding: "4px", borderRadius: "10px", marginBottom: "20px" }}>
                            {[{ key: "purchase", label: "💳 Achat" }, { key: "exchange", label: "🎁 Échange points" }].map(t => (
                                <button key={t.key} onClick={() => setActionTab(t.key)} style={{
                                    flex: 1, padding: "9px", background: actionTab === t.key ? "#3f3f46" : "transparent",
                                    border: "none", borderRadius: "8px",
                                    color: actionTab === t.key ? "white" : "#71717a",
                                    fontSize: "13px", fontWeight: actionTab === t.key ? "600" : "400"
                                }}>{t.label}</button>
                            ))}
                        </div>

                        {/* Achat */}
                        {actionTab === "purchase" && (
                            <form onSubmit={handlePurchase}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Montant (FCFA) *</label>
                                        <input type="number" value={actionForm.amount} onChange={e => setActionForm({ ...actionForm, amount: e.target.value })} required min={1}
                                            placeholder="ex: 5000"
                                            style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                    </div>
                                    {actionForm.amount && (
                                        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
                                            <p style={{ color: "#22c55e", fontWeight: "600", margin: 0 }}>
                                                +{pointsPreview} points seront ajoutés
                                            </p>
                                            <p style={{ color: "#71717a", fontSize: "12px", margin: "4px 0 0" }}>
                                                ({shopData.amount_step} FCFA = {shopData.points_per_step} pts)
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Description (optionnel)</label>
                                        <input value={actionForm.description} onChange={e => setActionForm({ ...actionForm, description: e.target.value })}
                                            placeholder="ex: Pizza + Boisson"
                                            style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                    </div>
                                    <button type="submit" disabled={loading} style={{
                                        padding: "12px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                        border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                                    }}>{loading ? "Enregistrement..." : "✅ Enregistrer l'achat"}</button>
                                </div>
                            </form>
                        )}

                        {/* Échange */}
                        {actionTab === "exchange" && (
                            <form onSubmit={handleExchange}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Récompense / Produit *</label>
                                        <input value={actionForm.reward_name} onChange={e => setActionForm({ ...actionForm, reward_name: e.target.value })} required
                                            placeholder="ex: Poulet braisé offert"
                                            style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                    </div>
                                    <div>
                                        <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Points à utiliser *</label>
                                        <input type="number" value={actionForm.points_used} onChange={e => setActionForm({ ...actionForm, points_used: e.target.value })} required
                                            min={1} max={actionModal.remaining_points}
                                            placeholder={`Max: ${actionModal.remaining_points} pts`}
                                            style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                    </div>
                                    {actionForm.points_used && (
                                        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "12px" }}>
                                            <p style={{ color: "#f59e0b", fontWeight: "600", margin: 0 }}>
                                                Points restants après échange : {actionModal.remaining_points - Number(actionForm.points_used)}
                                            </p>
                                        </div>
                                    )}
                                    <button type="submit" disabled={loading} style={{
                                        padding: "12px", background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                        border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                                    }}>{loading ? "Enregistrement..." : "🎁 Confirmer l'échange"}</button>
                                </div>
                            </form>
                        )}

                        {/* Historique */}
                        {transactions.length > 0 && (
                            <div style={{ marginTop: "20px", borderTop: "1px solid #27272a", paddingTop: "20px" }}>
                                <p style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Historique récent</p>
                                {transactions.slice(0, 4).map(tx => (
                                    <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #27272a" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span>{tx.type === "purchase" ? "💳" : "🎁"}</span>
                                            <div>
                                                <p style={{ color: "white", fontSize: "12px", margin: 0 }}>
                                                    {tx.type === "purchase" ? `${tx.amount?.toLocaleString()} FCFA` : tx.reward_name}
                                                </p>
                                                <p style={{ color: "#71717a", fontSize: "11px", margin: 0 }}>{formatDate(tx.created_at)}</p>
                                            </div>
                                        </div>
                                        <span style={{ color: tx.type === "purchase" ? "#22c55e" : "#f59e0b", fontWeight: "600", fontSize: "13px" }}>
                                            {tx.type === "purchase" ? `+${tx.points_added}` : `-${tx.points_used}`} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </ShopLayout>
    );
}
