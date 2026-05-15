import { useNavigate }
from "react-router-dom";

export default function ShopCard(props) {

    const navigate =
        useNavigate();

    const shop =
        props.shop || {};

    let expired = false;

    if (
        shop.subscription_ends_at &&
        shop.subscription_ends_at.seconds
    ) {

        expired =
            new Date(
                shop.subscription_ends_at.seconds * 1000
            ) < new Date();
    }

    return (

        <div style={{

            background:"#18181b",

            padding:"20px",

            borderRadius:"20px",

            border:
                expired
                ? "1px solid red"
                : "1px solid #333"

        }}>

            <h2 style={{
                color:"white",
                marginBottom:"10px"
            }}>

                {
                    shop.shop_name ||
                    "Boutique sans nom"
                }

            </h2>

            <p style={{
                color:"#999"
            }}>

                {
                    shop.category ||
                    "Catégorie non définie"
                }

            </p>

            <p style={{
                color:"#999"
            }}>

                {
                    shop.email ||
                    "Email non défini"
                }

            </p>

            <div style={{
                marginTop:"20px",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
            }}>

                <span style={{

                    background:
                        expired
                        ? "red"
                        : "#16a34a",

                    color:"white",

                    padding:"8px 14px",

                    borderRadius:"999px",

                    fontSize:"12px"
                }}>

                    {
                        expired
                        ? "Expiré"
                        : "Actif"
                    }

                </span>

                <button

                    onClick={() =>
                        navigate(
                            `/admin/shops/${shop.id}`
                        )
                    }

                    style={{

                        background:"#2563eb",

                        border:"none",

                        color:"white",

                        padding:"10px 15px",

                        borderRadius:"10px",

                        cursor:"pointer"
                    }}
                >

                    Voir détails

                </button>

            </div>

        </div>
    );
}
