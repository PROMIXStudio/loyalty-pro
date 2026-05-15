import { useEffect, useRef, useState } from "react";
import ShopLayout from "../../layouts/ShopLayout";
import { useAuth } from "../../contexts/AuthContext";
import { findCustomerByQR, getCustomer } from "../../services/firebase/customerService";
import { recordPurchase, recordRewardExchange, calculatePoints } from "../../services/firebase/transactionService";
import { openWhatsApp, buildWhatsAppMessage } from "../../services/firebase/notificationService";
import { getDocs, query, collection, where } from "firebase/firestore";
import { db } from "../../firebase";
import jsQR from "jsqr";

export default function ShopScanPage() {
    const { shopData } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [error, setError] = useState("");
    const [actionTab, setActionTab] = useState("purchase");
    const [form, setForm] = useState({ amount: "", description: "", points_used: "", reward_name: "" });
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (shopData?.id) {
            getDocs(query(collection(db, "settings"), where("shop_id", "==", shopData.id)))
                .then(snap => { if (!snap.empty) setSettings(snap.docs[0].data()); });
        }
        return () => stopCamera();
    }, [shopData]);

    async function startCamera() {
        setError("");
        setCustomer(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setScanning(true);
            intervalRef.current = setInterval(scanFrame, 300);
        } catch {
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    }

    function stopCamera() {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        clearInterval(intervalRef.current);
        setScanning(false);
    }

    function scanFrame() {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
            handleQrFound(code.data);
        }
    }

    async function handleQrFound(qrValue) {
        stopCamera();
        setError("");
        // Format: LOYALTY|customerId|shopId
        const parts = qrValue.split("|");
        if (parts.length < 3 || parts[0] !== "LOYALTY") {
            setError("QR code non reconnu.");
            return;
        }
        const customerId = parts[1];
        const shopId = parts[2];
        if (shopId !== shopData.id) {
            setError("Ce QR appartient à une autre boutique.");
            return;
        }
        const cust = await getCustomer(customerId);
        if (!cust) {
            setError("Client introuvable.");
            return;
        }
        setCustomer(cust);
        setForm({ amount: "", description: "", points_used: "", reward_name: "" });
    }

    async function handlePurchase(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const pts = await recordPurchase({
                shop_id: shopData.id, customer_id: customer.id,
                amount: Number(form.amount), description: form.description,
                amount_step: shopData.amount_step, points_per_step: shopData.points_per_step
            });
            const updated = await getCustomer(customer.id);
            setCustomer(updated);
            if (settings?.whatsapp_enabled && customer.phone) {
                const msg = buildWhatsAppMessage(
                    settings.purchase_message || "Merci {full_name} ! +{points} points. Total: {total_points} pts.",
                    { full_name: customer.full_name, points: pts, total_points: updated?.total_points, remaining_points: updated?.remaining_points, shop_name: shopData.shop_name, amount: form.amount }
                );
                openWhatsApp(customer.phone, msg);
            }
            setForm({ amount: "", description: "", points_used: "", reward_name: "" });
            alert(`✅ Achat enregistré ! +${pts} points`);
        } finally {
            setLoading(false);
        }
    }

    async function handleExchange(e) {
        e.preventDefault();
        if (Number(form.points_used) > customer.remaining_points) {
            alert("Points insuffisants !");
            return;
        }
        setLoading(true);
        try {
            await recordRewardExchange({
                shop_id: shopData.id, customer_id: customer.id,
                points_used: Number(form.points_used), reward_name: form.reward_name
            });
            const updated = await getCustomer(customer.id);
            setCustomer(updated);
            if (settings?.whatsapp_enabled && customer.phone) {
                const msg = buildWhatsAppMessage(
                    settings.reward_message || "Félicitations {full_name} ! Échange: {reward_name}. Restant: {remaining_points} pts.",
                    { full_name: customer.full_name, points_used: form.points_used, reward_name: form.reward_name, remaining_points: updated?.remaining_points, shop_name: shopData.shop_name }
                );
                openWhatsApp(customer.phone, msg);
            }
            setForm({ amount: "", description: "", points_used: "", reward_name: "" });
            alert("🎁 Échange enregistré !");
        } finally {
            setLoading(false);
        }
    }

    const pointsPreview = form.amount ? calculatePoints(Number(form.amount), shopData?.amount_step, shopData?.points_per_step) : 0;

    return (
        <ShopLayout title="Scanner QR" subtitle="Identifiez un client par son code QR">
            <div style={{ maxWidth: "700px" }}>
                {!customer ? (
                    <div>
                        {/* Scanner */}
                        <div style={{ background: "#18181b", borderRadius: "20px", border: "1px solid #27272a", overflow: "hidden", marginBottom: "20px" }}>
                            <div style={{ position: "relative", background: "#09090b", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <video ref={videoRef} style={{ width: "100%", maxHeight: "400px", display: scanning ? "block" : "none" }} playsInline />
                                <canvas ref={canvasRef} style={{ display: "none" }} />

                                {!scanning && (
                                    <div style={{ textAlign: "center", padding: "40px" }}>
                                        <div style={{ fontSize: "64px", marginBottom: "16px" }}>📷</div>
                                        <p style={{ color: "#71717a", fontSize: "15px" }}>Caméra arrêtée</p>
                                    </div>
                                )}

                                {scanning && (
                                    <div style={{
                                        position: "absolute", top: "50%", left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: "200px", height: "200px",
                                        border: "3px solid #8b5cf6",
                                        borderRadius: "16px", pointerEvents: "none",
                                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)"
                                    }} />
                                )}
                            </div>

                            <div style={{ padding: "20px", display: "flex", gap: "12px", justifyContent: "center" }}>
                                {!scanning ? (
                                    <button onClick={startCamera} style={{
                                        padding: "12px 32px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                        border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600"
                                    }}>📷 Démarrer le scan</button>
                                ) : (
                                    <button onClick={stopCamera} style={{
                                        padding: "12px 32px", background: "rgba(239,68,68,0.1)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        borderRadius: "10px", color: "#f87171", fontSize: "15px", fontWeight: "600"
                                    }}>⏹️ Arrêter</button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px 18px", color: "#f87171" }}>
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Fiche client */}
                        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px", marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{
                                        width: "52px", height: "52px", borderRadius: "14px",
                                        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "22px", fontWeight: "700", color: "white"
                                    }}>{customer.full_name?.[0]?.toUpperCase()}</div>
                                    <div>
                                        <h3 style={{ color: "white", margin: "0 0 4px", fontSize: "18px", fontWeight: "700" }}>{customer.full_name}</h3>
                                        <p style={{ color: "#71717a", margin: 0 }}>{customer.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setCustomer(null); setError(""); }} style={{
                                    background: "transparent", border: "1px solid #3f3f46", borderRadius: "8px",
                                    color: "#a1a1aa", padding: "8px 16px", fontSize: "13px"
                                }}>Nouveau scan</button>
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ background: "#27272a", borderRadius: "10px", padding: "14px", flex: 1 }}>
                                    <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points totaux</p>
                                    <p style={{ color: "#a78bfa", fontWeight: "700", fontSize: "20px", margin: 0 }}>{customer.total_points}</p>
                                </div>
                                <div style={{ background: "#27272a", borderRadius: "10px", padding: "14px", flex: 1 }}>
                                    <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px" }}>Points restants</p>
                                    <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "20px", margin: 0 }}>{customer.remaining_points}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                            <div style={{ display: "flex", background: "#27272a", padding: "4px", borderRadius: "10px", marginBottom: "20px" }}>
                                {[{ key: "purchase", label: "💳 Achat" }, { key: "exchange", label: "🎁 Échange" }].map(t => (
                                    <button key={t.key} onClick={() => setActionTab(t.key)} style={{
                                        flex: 1, padding: "10px", background: actionTab === t.key ? "#3f3f46" : "transparent",
                                        border: "none", borderRadius: "8px",
                                        color: actionTab === t.key ? "white" : "#71717a",
                                        fontSize: "14px", fontWeight: actionTab === t.key ? "600" : "400"
                                    }}>{t.label}</button>
                                ))}
                            </div>

                            {actionTab === "purchase" && (
                                <form onSubmit={handlePurchase}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                        <div>
                                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Montant (FCFA) *</label>
                                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min={1}
                                                placeholder="ex: 5000"
                                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "15px" }} />
                                        </div>
                                        {form.amount && (
                                            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "12px" }}>
                                                <p style={{ color: "#22c55e", fontWeight: "600", margin: 0 }}>+{pointsPreview} points seront ajoutés</p>
                                            </div>
                                        )}
                                        <div>
                                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Description</label>
                                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                                placeholder="Produits achetés..."
                                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                        </div>
                                        <button type="submit" disabled={loading} style={{
                                            padding: "13px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                            border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600"
                                        }}>{loading ? "Enregistrement..." : "✅ Valider l'achat"}</button>
                                    </div>
                                </form>
                            )}

                            {actionTab === "exchange" && (
                                <form onSubmit={handleExchange}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                        <div>
                                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Récompense *</label>
                                            <input value={form.reward_name} onChange={e => setForm({ ...form, reward_name: e.target.value })} required
                                                placeholder="Nom du produit offert"
                                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                        </div>
                                        <div>
                                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "6px" }}>Points à utiliser * (max: {customer.remaining_points})</label>
                                            <input type="number" value={form.points_used} onChange={e => setForm({ ...form, points_used: e.target.value })} required
                                                min={1} max={customer.remaining_points}
                                                style={{ width: "100%", padding: "11px 14px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "14px" }} />
                                        </div>
                                        <button type="submit" disabled={loading} style={{
                                            padding: "13px", background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                            border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600"
                                        }}>{loading ? "Enregistrement..." : "🎁 Confirmer l'échange"}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
