import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";

// Auth
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminShopsPage from "../pages/admin/AdminShopsPage";
import AdminShopDetail from "../pages/admin/AdminShopDetail";
import AdminOwnersPage from "../pages/admin/AdminOwnersPage";
import AdminSubscriptionsPage from "../pages/admin/AdminSubscriptionsPage";
import AdminNotificationsPage from "../pages/admin/AdminNotificationsPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";

// Shop
import ShopDashboard from "../pages/shop/ShopDashboard";
import ShopCustomersPage from "../pages/shop/ShopCustomersPage";
import ShopScanPage from "../pages/shop/ShopScanPage";
import ShopNotificationsPage from "../pages/shop/ShopNotificationsPage";
import ShopSettingsPage from "../pages/shop/ShopSettingsPage";

function AdminRoute({ children }) {
    const { user, role, loading } = useAuth();
    if (loading) return <div style={{ background: "#09090b", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#3b82f6", fontSize: 18 }}>Chargement...</span></div>;
    if (!user || role !== "admin") return <Navigate to="/" replace />;
    return children;
}

function ShopRoute({ children }) {
    const { user, role, loading } = useAuth();
    if (loading) return <div style={{ background: "#09090b", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#3b82f6", fontSize: 18 }}>Chargement...</span></div>;
    if (!user || (role !== "owner" && role !== "manager")) return <Navigate to="/" replace />;
    return <SubscriptionProvider>{children}</SubscriptionProvider>;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/shops" element={<AdminRoute><AdminShopsPage /></AdminRoute>} />
            <Route path="/admin/shops/:id" element={<AdminRoute><AdminShopDetail /></AdminRoute>} />
            <Route path="/admin/owners" element={<AdminRoute><AdminOwnersPage /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptionsPage /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />

            {/* Shop */}
            <Route path="/shop" element={<ShopRoute><ShopDashboard /></ShopRoute>} />
            <Route path="/shop/customers" element={<ShopRoute><ShopCustomersPage /></ShopRoute>} />
            <Route path="/shop/scan" element={<ShopRoute><ShopScanPage /></ShopRoute>} />
            <Route path="/shop/notifications" element={<ShopRoute><ShopNotificationsPage /></ShopRoute>} />
            <Route path="/shop/settings" element={<ShopRoute><ShopSettingsPage /></ShopRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
