import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { auth, db } from "../../firebase";

export default function ForgotPassword() {
    const [shopName, setShopName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function handleReset(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Vérifier que la boutique + email correspondent à un propriétaire
            const shopsQ = query(collection(db, "shops"), where("shop_name_lower", "==", shopName.trim().toLowerCase()));
            const shopsSnap = await getDocs(shopsQ);

            if (shopsSnap.empty) {
                setError("Boutique introuvable.");
                setLoading(false);
                return;
            }

            const shopId = shopsSnap.docs[0].id;
            const ownerQ = query(
                collection(db, "shop_users"),
                where("shop_id", "==", shopId),
                where("email", "==", email.trim().toLowerCase()),
                where("role", "==", "owner")
            );
            const ownerSnap = await getDocs(ownerQ);

            if (ownerSnap.empty) {
                setError("Aucun propriétaire trouvé avec ces informations. Seul le propriétaire peut réinitialiser le mot de passe.");
                setLoading(false);
                return;
            }

            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err) {
            setError("Erreur lors de l'envoi. Vérifiez votre email.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #0f172a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
            <div style={{ width: "100%", maxWidth: "420px" }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div style={{
                        width: "60px", height: "60px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        borderRadius: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px"
                    }}>
                        <span style={{ fontSize: "28px" }}>💎</span>
                    </div>
                    <h1 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>Loyalty Pro</h1>
                </div>

                <div style={{ background: "#18181b", borderRadius: "20px", padding: "32px", border: "1px solid #27272a" }}>
                    {success ? (
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                            <h2 style={{ color: "white", fontSize: "20px", marginBottom: "12px" }}>Email envoyé !</h2>
                            <p style={{ color: "#a1a1aa", fontSize: "14px", marginBottom: "24px" }}>
                                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                            </p>
                            <Link to="/" style={{
                                display: "inline-block", padding: "12px 24px",
                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600"
                            }}>
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 style={{ color: "white", fontSize: "20px", fontWeight: "600", margin: "0 0 8px" }}>Mot de passe oublié</h2>
                            <p style={{ color: "#71717a", fontSize: "14px", marginBottom: "24px" }}>
                                Réservé aux propriétaires de boutique uniquement.
                            </p>

                            {error && (
                                <div style={{
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                    borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
                                    color: "#f87171", fontSize: "14px"
                                }}>{error}</div>
                            )}

                            <form onSubmit={handleReset}>
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                        Nom de la boutique
                                    </label>
                                    <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} required
                                        placeholder="ex: MPH SHOP"
                                        style={{ width: "100%", padding: "12px 16px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "15px" }}
                                    />
                                </div>
                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                        Email du propriétaire
                                    </label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                        placeholder="proprietaire@email.com"
                                        style={{ width: "100%", padding: "12px 16px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "15px" }}
                                    />
                                </div>
                                <button type="submit" disabled={loading} style={{
                                    width: "100%", padding: "14px",
                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600"
                                }}>
                                    {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                                </button>
                            </form>
                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <Link to="/" style={{ color: "#3b82f6", fontSize: "14px" }}>← Retour à la connexion</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
