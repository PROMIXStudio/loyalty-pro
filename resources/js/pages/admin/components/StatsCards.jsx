import { useNavigate }
from "react-router-dom";

export default function ShopCard({

    shop

}) {

    const navigate =
        useNavigate();

    const expired =
        shop.subscription_ends_at &&
        new Date(
            shop.subscription_ends_at.seconds * 1000
        ) < new Date();

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
                color:"white"
            }}>
                {shop.shop_name}
            </h2>

            <p style={{
                color:"#999"
            }}>
                {shop.category}
            </p>

            <div style={{
                marginTop:"20px"
            }}>

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
