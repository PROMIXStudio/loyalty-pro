import ShopSidebar from "../components/shop/ShopSidebar";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useAuth } from "../contexts/AuthContext";

function BlockedScreen() {
    const { logout, shopData } = useAuth();
    return (
        <div style={{
            minHeight: "100vh", background: "#09090b",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
            <div style={{
                background: "#18181b", borderRadius: "20px", padding: "48px 40px",
                border: "1px solid rgba(239,68,68,0.3)", textAlign: "center", maxWidth: "480px"
            }}>
                <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
                <h1 style={{ color: "white", fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>
                    Abonnement expiré
                </h1>
                <p style={{ color: "#a1a1aa", fontSize: "15px", lineHeight: "1.6", marginBottom: "8px" }}>
                    L'abonnement de <strong style={{ color: "white" }}>{shopData?.shop_name}</strong> a expiré.
                    Toutes les actions sont suspendues.
                </p>
                <p style={{ color: "#71717a", fontSize: "14px", marginBottom: "32px" }}>
                    Contactez l'administrateur pour renouveler votre abonnement.
                </p>
                <div style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "12px", padding: "16px", marginBottom: "24px"
                }}>
                    <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>
                        📞 Contactez l'administrateur pour le renouvellement
                    </p>
                </div>
                <button onClick={logout} style={{
                    padding: "12px 32px", background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "600"
                }}>
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}

export default function ShopLayout({ children, title = "Dashboard", subtitle = "" }) {
    const { isBlocked, daysLeft, subStatus } = useSubscription();
    const { shopData } = useAuth();

    if (isBlocked) return <BlockedScreen />;

    return (
        <div style={{ display: "flex", background: "#09090b", minHeight: "100vh" }}>
            <ShopSidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Topbar */}
                <div style={{
                    height: "72px", background: "#18181b",
                    borderBottom: "1px solid #27272a",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 32px", flexShrink: 0
                }}>
                    <div>
                        <h1 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "700" }}>{title}</h1>
                        {subtitle && <p style={{ color: "#71717a", margin: 0, fontSize: "13px" }}>{subtitle}</p>}
                    </div>
                    {/* Alertes abonnement */}
                    {subStatus === "warning" && (
                        <div style={{
                            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
                            borderRadius: "10px", padding: "8px 16px", color: "#fb923c", fontSize: "13px"
                        }}>
                            ⚠️ Abonnement expire dans {daysLeft} jours
                        </div>
                    )}
                    {subStatus === "critical" && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "10px", padding: "8px 16px", color: "#f87171", fontSize: "13px"
                        }}>
                            🚨 Abonnement expire très bientôt !
                        </div>
                    )}
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
