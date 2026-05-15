import {
    useEffect,
    useState
}
from "react";

import AdminLayout
from "../../layouts/AdminLayout";

import ShopCard
from "./components/ShopCard";

import ShopFilters
from "./components/ShopFilters";

import {
    getShops
}
from "../../services/firebase/shopService";

export default function ShopsPage() {

    const [shops, setShops] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState("all");

    async function loadShops() {

        const data =
            await getShops();

        setShops(data);
    }

    useEffect(()=>{

        loadShops();

    }, []);

    const filteredShops =
        shops.filter(shop => {

            const matchesSearch =
                shop.shop_name
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            if(filter === "all")
                return matchesSearch;

            const expired =
                shop.subscription_ends_at &&
                new Date(
                    shop.subscription_ends_at.seconds * 1000
                ) < new Date();

            if(filter === "expired")
                return expired && matchesSearch;

            if(filter === "active")
                return !expired && matchesSearch;

            return true;
        });

    return (

        <AdminLayout>

            <div style={{
                padding:"20px"
            }}>

                <h1 style={{
                    color:"white",
                    marginBottom:"30px"
                }}>
                    Boutiques
                </h1>

                <ShopFilters

                    search={search}

                    setSearch={setSearch}

                    filter={filter}

                    setFilter={setFilter}

                />

                <div style={{

                    display:"grid",

                    gridTemplateColumns:
                        "repeat(3, 1fr)",

                    gap:"20px"
                }}>

                    {
                        filteredShops.map(shop => (

                            <ShopCard
                                key={shop.id}
                                shop={shop}
                            />

                        ))
                    }

                </div>

            </div>

        </AdminLayout>
    );
}
