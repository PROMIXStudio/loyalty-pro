import { useAuth } from "../../contexts/AuthContext";
import AdminLayout from "../../layouts/AdminLayout";

export default function AdminSettingsPage() {
    const { user } = useAuth();

    return (
        <AdminLayout title="Paramètres" subtitle="Configuration administrateur">
            <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                    <h3 style={{ color: "white", margin: "0 0 16px", fontSize: "16px" }}>Compte administrateur</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                            width: "56px", height: "56px", borderRadius: "14px",
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "24px", color: "white", fontWeight: "700"
                        }}>
                            {user?.email?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <p style={{ color: "white", fontWeight: "600", margin: "0 0 4px" }}>Administrateur</p>
                            <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>{user?.email}</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                    <h3 style={{ color: "white", margin: "0 0 8px", fontSize: "16px" }}>🔐 Sécurité & Double authentification</h3>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: "0 0 16px", lineHeight: "1.6" }}>
                        La double authentification (2FA) est gérée directement dans Firebase Console.
                        Vous pouvez activer Google Authenticator ou l'authentification par SMS.
                    </p>
                    <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px", background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.3)", borderRadius: "10px",
                        color: "#60a5fa", fontSize: "14px", fontWeight: "600"
                    }}>
                        🔗 Ouvrir Firebase Console
                    </a>
                </div>

                <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                    <h3 style={{ color: "white", margin: "0 0 8px", fontSize: "16px" }}>⏱️ Durée d'abonnement test</h3>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: "0 0 12px" }}>
                        Actuellement configuré à <strong style={{ color: "#f59e0b" }}>5 minutes</strong> pour les tests.
                    </p>
                    <p style={{ color: "#52525b", fontSize: "13px", margin: 0 }}>
                        Pour passer en production, modifier la valeur dans :
                        <code style={{ background: "#27272a", padding: "2px 8px", borderRadius: "6px", color: "#a78bfa", marginLeft: "8px" }}>
                            services/firebase/shopService.js
                        </code>
                        <br />
                        Remplacer <code style={{ color: "#f59e0b" }}>5 * 60 * 1000</code> par <code style={{ color: "#22c55e" }}>30 * 24 * 60 * 60 * 1000</code> (30 jours)
                    </p>
                </div>

                <div style={{ background: "#18181b", borderRadius: "16px", border: "1px solid #27272a", padding: "24px" }}>
                    <h3 style={{ color: "white", margin: "0 0 8px", fontSize: "16px" }}>📋 Instructions Firestore Rules</h3>
                    <p style={{ color: "#71717a", fontSize: "14px", margin: "0 0 12px" }}>
                        Pour les tests, utiliser ces règles dans Firebase Console → Firestore → Rules :
                    </p>
                    <pre style={{
                        background: "#27272a", borderRadius: "10px", padding: "16px",
                        color: "#a1a1aa", fontSize: "13px", overflow: "auto",
                        margin: 0, lineHeight: "1.5"
                    }}>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
                </div>
            </div>
        </AdminLayout>
    );
}
