export default function ShopFilters({

    search,

    setSearch,

    filter,

    setFilter

}) {

    return (

        <div style={{

            display:"flex",

            gap:"20px",

            marginBottom:"30px"
        }}>

            <input

                placeholder="Rechercher boutique..."

                value={search}

                onChange={(e)=>
                    setSearch(
                        e.target.value
                    )
                }

                style={{

                    flex:1,

                    padding:"15px",

                    background:"#18181b",

                    border:"none",

                    borderRadius:"12px",

                    color:"white"
                }}
            />

            <select

                value={filter}

                onChange={(e)=>
                    setFilter(
                        e.target.value
                    )
                }

                style={{

                    padding:"15px",

                    background:"#18181b",

                    border:"none",

                    borderRadius:"12px",

                    color:"white"
                }}
            >

                <option value="all">
                    Toutes
                </option>

                <option value="active">
                    Actives
                </option>

                <option value="expired">
                    Expirées
                </option>

            </select>

        </div>
    );
}
