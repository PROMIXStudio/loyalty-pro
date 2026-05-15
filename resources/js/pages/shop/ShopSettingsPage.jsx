import ShopLayout from "../../layouts/ShopLayout";

export default function ShopSettingsPage() {

    return (

        <ShopLayout
            title="Paramètres"
            subtitle="Configuration de la boutique"
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
                    Paramètres boutique
                </h2>

                <p style={{
                    color: "#71717a"
                }}>
                    Cette page sera configurée ensuite.
                </p>

            </div>

        </ShopLayout>
    );
}
