import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const menus = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Boutiques", path: "/admin/shops", icon: "🏪" },
    { name: "Propriétaires", path: "/admin/owners", icon: "👥" },
    { name: "Abonnements", path: "/admin/subscriptions", icon: "📅" },
    { name: "Notifications", path: "/admin/notifications", icon: "🔔" },
    { name: "Paramètres", path: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <div style={{
            width: "260px", minWidth: "260px",
            background: "#18181b",
            minHeight: "100vh",
            borderRight: "1px solid #27272a",
            display: "flex", flexDirection: "column",
            padding: "24px 16px"
        }}>
            {/* Logo */}
            <div style={{ marginBottom: "32px", paddingLeft: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "40px", height: "40px",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <span style={{ fontSize: "20px" }}>💎</span>
                    </div>
                    <div>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>Loyalty Pro</div>
                        <div style={{ color: "#71717a", fontSize: "11px" }}>Administration</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1 }}>
                {menus.map((menu) => {
                    const isActive = location.pathname === menu.path ||
                        (menu.path !== "/admin" && location.pathname.startsWith(menu.path));
                    return (
                        <Link key={menu.path} to={menu.path} style={{ textDecoration: "none", display: "block", marginBottom: "4px" }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 14px", borderRadius: "10px",
                                background: isActive ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
                                color: isActive ? "white" : "#a1a1aa",
                                fontWeight: isActive ? "600" : "400",
                                fontSize: "14px",
                                transition: "all 0.2s"
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

            {/* Logout */}
            <button
                onClick={logout}
                style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", borderRadius: "10px",
                    background: "transparent", border: "none",
                    color: "#71717a", fontSize: "14px", cursor: "pointer", width: "100%",
                    transition: "all 0.2s"
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
