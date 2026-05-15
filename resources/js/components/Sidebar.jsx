import { Link }
from "react-router-dom";

export default function Sidebar() {

    const menus = [

        {
            name:"Dashboard",
            path:"/admin"
        },

        {
            name:"Boutiques",
            path:"/admin/shops"
        },

        {
            name:"Propriétaires",
            path:"/admin/owners"
        },

        {
            name:"Abonnements",
            path:"/admin/subscriptions"
        },

        {
            name:"Notifications",
            path:"/admin/notifications"
        },

        {
            name:"Paramètres",
            path:"/admin/settings"
        }
    ];

    return (

        <div style={{

            width:"260px",

            background:"#18181b",

            minHeight:"100vh",

            padding:"20px"
        }}>

            <h1 style={{

                color:"white",

                marginBottom:"40px"
            }}>

                Loyalty Pro Admin

            </h1>

            {
                menus.map((menu,index)=> (

                    <Link

                        key={index}

                        to={menu.path}

                        style={{
                            textDecoration:"none"
                        }}
                    >

                        <div style={{

                            color:"white",

                            padding:"15px",

                            marginBottom:"10px",

                            background:"#27272a",

                            borderRadius:"10px",

                            cursor:"pointer"
                        }}>

                            {menu.name}

                        </div>

                    </Link>
                ))
            }

        </div>
    );
}
