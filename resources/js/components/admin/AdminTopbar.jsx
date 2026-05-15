import { useAuth } from "../../contexts/AuthContext";

export default function AdminTopbar({
    title = "Dashboard",
    subtitle = ""
}) {

    const { user } = useAuth();

    return (

        <div style={{
            height: "72px",
            background: "#18181b",
            borderBottom: "1px solid #27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            flexShrink: 0
        }}>

            <div>

                <h1 style={{
                    color: "white",
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700"
                }}>
                    {title}
                </h1>

                {

                    subtitle && (

                        <p style={{
                            color: "#71717a",
                            margin: 0,
                            fontSize: "13px"
                        }}>
                            {subtitle}
                        </p>
                    )
                }

            </div>

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px"
            }}>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>

                    <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e"
                    }}></div>

                    <span style={{
                        color: "#22c55e",
                        fontSize: "13px"
                    }}>
                        Serveur actif
                    </span>

                </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#27272a",
                    borderRadius: "10px",
                    padding: "8px 14px"
                }}>

                    <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "white"
                    }}>
                        {user?.email?.[0]?.toUpperCase() || "A"}
                    </div>

                    <div>

                        <div style={{
                            color: "white",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}>
                            Admin
                        </div>

                        <div style={{
                            color: "#71717a",
                            fontSize: "11px"
                        }}>
                            {user?.email || ""}
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
