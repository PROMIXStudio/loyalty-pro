import { useParams }
from "react-router-dom";

import AdminLayout
from "../../layouts/AdminLayout";

export default function ShopDetailsPage() {

    const { id } =
        useParams();

    return (

        <AdminLayout>

            <div style={{
                padding:"20px",
                color:"white"
            }}>

                <h1>
                    Détails Boutique
                </h1>

                <p>
                    ID : {id}
                </p>

            </div>

        </AdminLayout>
    );
}
