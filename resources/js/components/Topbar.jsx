export default function Topbar() {

    return (

        <div style={{

            height:"80px",

            background:"#18181b",

            borderBottom:"1px solid #333",

            display:"flex",

            alignItems:"center",

            justifyContent:"space-between",

            padding:"0 30px"
        }}>

            {/* LEFT */}

            <div>

                <h1 style={{
                    color:"white",
                    margin:0,
                    fontSize:"24px"
                }}>
                    Administration
                </h1>

                <p style={{
                    color:"#999",
                    margin:0,
                    fontSize:"14px"
                }}>
                    Gestion des boutiques et abonnements
                </p>

            </div>

            {/* CENTER */}

            <div style={{
                width:"400px"
            }}>

                <input
                    type="text"

                    placeholder="Rechercher une boutique..."

                    style={{
                        width:"100%",
                        padding:"12px",
                        borderRadius:"10px",
                        border:"none",
                        background:"#27272a",
                        color:"white"
                    }}
                />

            </div>

            {/* RIGHT */}

            <div style={{
                display:"flex",
                alignItems:"center",
                gap:"20px"
            }}>

                <div style={{
                    width:"12px",
                    height:"12px",
                    borderRadius:"50%",
                    background:"#22c55e"
                }}></div>

                <span style={{
                    color:"#22c55e"
                }}>
                    Serveur actif
                </span>

                <div style={{
                    width:"45px",
                    height:"45px",
                    borderRadius:"50%",
                    background:"#2563eb"
                }}></div>

            </div>

        </div>
    );
}
