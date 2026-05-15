import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

export default function AdminLayout({ children, title, subtitle }) {
    return (
        <div style={{ display: "flex", background: "#09090b", minHeight: "100vh" }}>
            <AdminSidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <AdminTopbar title={title} subtitle={subtitle} />
                <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
