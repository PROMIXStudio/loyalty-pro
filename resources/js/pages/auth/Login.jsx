import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebase";

export default function Login() {
    const [shopName, setShopName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const uid = credential.user.uid;

            // Vérifier si admin
            const adminDoc = await getDoc(doc(db, "admins", uid));
            if (adminDoc.exists()) {
                navigate("/admin");
                return;
            }

            // Vérifier shop_users avec shop_name
            const shopsQ = query(collection(db, "shops"), where("shop_name_lower", "==", shopName.trim().toLowerCase()));
            const shopsSnap = await getDocs(shopsQ);
            if (shopsSnap.empty) {
                setError("Boutique introuvable. Vérifiez le nom.");
                await auth.signOut();
                setLoading(false);
                return;
            }

            const shopId = shopsSnap.docs[0].id;
            const shopUsersQ = query(
                collection(db, "shop_users"),
                where("uid", "==", uid),
                where("shop_id", "==", shopId)
            );
            const shopUsersSnap = await getDocs(shopUsersQ);
            if (shopUsersSnap.empty) {
                setError("Accès refusé pour cette boutique.");
                await auth.signOut();
                setLoading(false);
                return;
            }

            navigate("/shop");
        } catch (err) {
            const msgs = {
                "auth/invalid-credential": "Email ou mot de passe incorrect.",
                "auth/user-not-found": "Aucun compte trouvé.",
                "auth/wrong-password": "Mot de passe incorrect.",
                "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
            };
            setError(msgs[err.code] || "Erreur de connexion.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #0f172a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <div style={{ width: "100%", maxWidth: "420px" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div style={{
                        width: "60px", height: "60px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        borderRadius: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "16px", boxShadow: "0 0 30px rgba(59,130,246,0.3)"
                    }}>
                        <span style={{ fontSize: "28px" }}>💎</span>
                    </div>
                    <h1 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>Loyalty Pro</h1>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>Système de fidélisation multi-boutiques</p>
                </div>

                {/* Card */}
                <div style={{
                    background: "#18181b",
                    borderRadius: "20px",
                    padding: "32px",
                    border: "1px solid #27272a",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
                }}>
                    <h2 style={{ color: "white", fontSize: "20px", fontWeight: "600", margin: "0 0 24px" }}>Connexion</h2>

                    {error && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
                            color: "#f87171", fontSize: "14px"
                        }}>{error}</div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                Nom de la boutique
                            </label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={e => setShopName(e.target.value)}
                                placeholder="ex: MPH SHOP"
                                style={{
                                    width: "100%", padding: "12px 16px", background: "#27272a",
                                    border: "1px solid #3f3f46", borderRadius: "10px", color: "white",
                                    fontSize: "15px", transition: "border 0.2s"
                                }}
                                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                                onBlur={e => e.target.style.borderColor = "#3f3f46"}
                            />
                            <p style={{ color: "#52525b", fontSize: "12px", margin: "6px 0 0" }}>
                                Laissez vide si vous êtes administrateur
                            </p>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                Adresse email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                required
                                style={{
                                    width: "100%", padding: "12px 16px", background: "#27272a",
                                    border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "15px"
                                }}
                                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                                onBlur={e => e.target.style.borderColor = "#3f3f46"}
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ color: "#a1a1aa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: "100%", padding: "12px 16px", background: "#27272a",
                                    border: "1px solid #3f3f46", borderRadius: "10px", color: "white", fontSize: "15px"
                                }}
                                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                                onBlur={e => e.target.style.borderColor = "#3f3f46"}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%", padding: "14px",
                                background: loading ? "#1e3a8a" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                border: "none", borderRadius: "10px", color: "white",
                                fontSize: "15px", fontWeight: "600",
                                boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                                transition: "all 0.2s", opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? "Connexion en cours..." : "Se connecter"}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <Link to="/forgot-password" style={{ color: "#3b82f6", fontSize: "14px" }}>
                            Mot de passe oublié ?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
