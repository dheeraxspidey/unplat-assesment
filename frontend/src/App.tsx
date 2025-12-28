import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import Dashboard from "@/pages/Dashboard"
import Explore from "@/pages/Explore"
import OrganizerDashboard from "@/pages/OrganizerDashboard"
import EventDetail from "@/pages/EventDetail"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import Navbar from "@/components/Navbar"

function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Navbar />
            <main className="container mx-auto py-6">
                {children}
            </main>
            <Toaster />
        </div>
    )
}

function PrivateRoute({ children, role }: { children: React.ReactElement, role?: string }) {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("role")

    if (!token) return <Navigate to="/login" />

    if (role && userRole !== role) {
        // Redirect to their appropriate home if trying to access wrong route
        return <Navigate to={userRole === "ORGANIZER" ? "/organizer" : "/dashboard"} />
    }

    return children
}

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Explore />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<PrivateRoute role="ATTENDEE"><Dashboard /></PrivateRoute>} />
                <Route path="/organizer" element={<PrivateRoute role="ORGANIZER"><OrganizerDashboard /></PrivateRoute>} />
                <Route path="/event/:id" element={<EventDetail />} />
            </Routes>
        </Layout>
    )
}

export default App
