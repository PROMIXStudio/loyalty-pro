export default function ShopTable({

    shops

}) {

    return (

        <div style={{
            background:"#18181b",
            borderRadius:"20px",
            padding:"20px"
        }}>

            <h1 style={{
                color:"white",
                marginBottom:"20px"
            }}>
                Boutiques
            </h1>

            {
                shops.map((shop)=> (

                    <div
                        key={shop.id}

                        style={{
                            color:"white",
                            padding:"15px",
                            borderBottom:
                                "1px solid #333"
                        }}
                    >

                        <h2>
                            {shop.shop_name}
                        </h2>

                        <p>
                            {shop.category}
                        </p>

                    </div>
                ))
            }

        </div>
    );
}
