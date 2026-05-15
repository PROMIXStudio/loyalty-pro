import { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getShops } from "../../services/firebase/shopService";
import { sendNotification, sendBroadcastNotification } from "../../services/firebase/notificationService";

export default function AdminNotificationsPage() {
    const [shops, setShops] = useState([]);
    const [mode, setMode] = useState("broadcast"); // "broadcast" | "targeted"
    const [selectedShops, setSelectedShops] = useState([]);
    const [form, setForm] = useState({ title: "", message: "", channel: "app" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        getShops().then(setShops);
    }, []);

    async function handleSend(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "broadcast") {
                await sendBroadcastNotification(shops.map(s => s.id), form);
            } else {
                for (const shopId of selectedShops) {
                    await sendNotification({ shop_id: shopId, ...form });
                }
            }
            setSuccess(true);
            setForm({ title: "", message: "", channel: "app" });
            setSelectedShops([]);
            setTimeout(() => setSuccess(false), 4000);
        } finally {
            setLoading(false);
        }
    }

    function toggleShop(shopId) {
        setSelectedShops(prev =>
            prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
        );
    }

    return (
        <AdminLayout title="Notifications" subtitle="Envoyer des messages aux boutiques">
            <div style={{ maxWidth: "700px" }}>
                {success && (
                    <div style={{
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
                        color: "#22c55e", fontWeight: "600"
                    }}>
                        ✅ Notification(s) envoyée(s) avec succès !
                    </div>
                )}

                {/* Mode selector */}
                <div style={{ display: "flex", gap: "4px", background: "#18181b", padding: "6px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #27272a" }}>
                    {[
                        { key: "broadcast", label: "📢 Toutes les boutiques" },
                        { key: "targeted", label: "🎯 Boutiques spécifiques" }
                    ].map(m => (
                        <button key={m.key} onClick={() => setMode(m.key)} style={{
                            flex: 1, padding: "10px", background: mode === m.key ? "#27272a" : "transparent",
                            border: "none", borderRadius: "8px",
                            color: mode === m.key ? "white" : "#71717a",
                            fontSize: "14px", fontWeight: mode === m.key ? "600" : "400"
                        }}>{m.label}</button>
                    ))}
                </div>

                {/* Sélection boutiques si ciblé */}
                {mode === "targeted" && (
                    <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "20px", marginBottom: "20px" }}>
                        <p style={{ color: "#a1a1aa", fontSize: "13px", margin: "0 0 12px", fontWeight: "600" }}>
                            Sélectionner les boutiques ({selectedShops.length} sélectionnée(s))
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                            {shops.map(shop => (
                                <div key={shop.id} onClick={() => toggleShop(shop.id)}
                                    style={{
                                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                                        background: selectedShops.includes(shop.id) ? "rgba(59,130,246,0.15)" : "#27272a",
                                        border: selectedShops.includes(shop.id) ? "1px solid rgba(59,130,246,0.5)" : "1px solid #3f3f46",
                                        color: selectedShops.includes(shop.id) ? "#60a5fa" : "#a1a1aa",
                                        fontSize: "13px", fontWeight: "500"
                                    }}>
                                    {selectedShops.includes(shop.id) ? "✓ " : ""}{shop.shop_name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Formulaire */}
                <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                    <form onSubmit={handleSend}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Titre *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    placeholder="ex: Nouvelle fonctionnalité disponible"
                                    style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                            </div>
                            <div>
                                <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Message *</label>
                                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5}
                                    placeholder="Contenu de votre message..."
                                    style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px", resize: "vertical" }} />
                            </div>
                            <div>
                                <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Canal d'envoi</label>
                                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
                                    style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }}>
                                    <option value="app">Notification in-app</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>

                            <div style={{ background: "#27272a", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#71717a" }}>
                                {mode === "broadcast"
                                    ? `📢 Ce message sera envoyé à ${shops.length} boutique(s)`
                                    : `🎯 Ce message sera envoyé à ${selectedShops.length} boutique(s) sélectionnée(s)`
                                }
                            </div>

                            <button type="submit" disabled={loading || (mode === "targeted" && selectedShops.length === 0)} style={{
                                padding: "13px 24px",
                                background: loading ? "#1e3a8a" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                border: "none", borderRadius: "10px", color: "white",
                                fontSize: "14px", fontWeight: "600", opacity: (mode === "targeted" && selectedShops.length === 0) ? 0.5 : 1
                            }}>
                                {loading ? "Envoi en cours..." : "Envoyer la notification"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
