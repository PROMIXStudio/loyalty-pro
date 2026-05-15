import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../contexts/SubscriptionContext";

const menus = [
    { name: "Dashboard", path: "/shop", icon: "📊" },
    { name: "Clients", path: "/shop/customers", icon: "👥" },
    { name: "Scanner QR", path: "/shop/scan", icon: "📷" },
    { name: "Notifications", path: "/shop/notifications", icon: "🔔" },
    { name: "Paramètres", path: "/shop/settings", icon: "⚙️" },
];

export default function ShopSidebar() {
    const location = useLocation();
    const { logout, shopData } = useAuth();
    const { daysLeft, subStatus } = useSubscription();

    const statusColors = { active: "#22c55e", trial: "#f59e0b", warning: "#f97316", critical: "#ef4444", expired: "#ef4444" };
    const statusLabels = { active: "Actif", trial: "Essai", warning: "Attention", critical: "Critique", expired: "Expiré" };

    return (
        <div style={{
            width: "260px", minWidth: "260px",
            background: "#18181b",
            minHeight: "100vh",
            borderRight: "1px solid #27272a",
            display: "flex", flexDirection: "column",
            padding: "24px 16px"
        }}>
            {/* Logo + Shop */}
            <div style={{ marginBottom: "24px", paddingLeft: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{
                        width: "40px", height: "40px",
                        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <span style={{ fontSize: "20px" }}>🏪</span>
                    </div>
                    <div>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>{shopData?.shop_name || "Boutique"}</div>
                        <div style={{ color: "#71717a", fontSize: "11px" }}>{shopData?.category || ""}</div>
                    </div>
                </div>

                {/* Statut abonnement */}
                {subStatus && (
                    <div style={{
                        background: "#27272a", borderRadius: "10px", padding: "10px 12px",
                        border: `1px solid ${statusColors[subStatus] || "#3f3f46"}20`
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "#a1a1aa", fontSize: "12px" }}>Abonnement</span>
                            <span style={{
                                background: `${statusColors[subStatus] || "#3f3f46"}20`,
                                color: statusColors[subStatus] || "#a1a1aa",
                                padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600"
                            }}>
                                {statusLabels[subStatus] || subStatus}
                            </span>
                        </div>
                        {daysLeft !== null && daysLeft > 0 && (
                            <div style={{ color: "#71717a", fontSize: "12px", marginTop: "4px" }}>
                                {daysLeft === 1 ? "Expire aujourd'hui !" : `Expire dans ${daysLeft} jours`}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1 }}>
                {menus.map((menu) => {
                    const isActive = location.pathname === menu.path ||
                        (menu.path !== "/shop" && location.pathname.startsWith(menu.path));
                    return (
                        <Link key={menu.path} to={menu.path} style={{ textDecoration: "none", display: "block", marginBottom: "4px" }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 14px", borderRadius: "10px",
                                background: isActive ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
                                color: isActive ? "white" : "#a1a1aa",
                                fontWeight: isActive ? "600" : "400",
                                fontSize: "14px", transition: "all 0.2s"
                            }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#27272a"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: "18px" }}>{menu.icon}</span>
                                {menu.name}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <button onClick={logout} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px", borderRadius: "10px",
                background: "transparent", border: "none",
                color: "#71717a", fontSize: "14px", cursor: "pointer", width: "100%"
            }}
                onMouseEnter={e => { e.currentTarget.style.background = "#27272a"; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#71717a"; }}
            >
                <span style={{ fontSize: "18px" }}>🚪</span>
                Déconnexion
            </button>
        </div>
    );
}
