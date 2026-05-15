import AdminLayout
from "../../layouts/AdminLayout";

export default function AdminOwnersPage() {

    return (

        <AdminLayout
            title="Propriétaires"
            subtitle="Gestion des propriétaires"
        >

            <div style={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "16px",
                padding: "30px"
            }}>

                <h2 style={{
                    color: "white",
                    marginTop: 0
                }}>
                    Gestion des propriétaires
                </h2>

                <p style={{
                    color: "#71717a"
                }}>
                    Cette page sera configurée ensuite.
                </p>

            </div>

        </AdminLayout>
    );
}
