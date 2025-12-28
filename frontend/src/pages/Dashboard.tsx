import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Link } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ticket, Calendar, Clock, MapPin, Armchair, ChevronLeft, ChevronRight } from "lucide-react"

interface Booking {
    id: number
    event_id: number
    status: string
    number_of_seats: number
    event: {
        id: number
        title: string
        date: string
        location: string
        image_id?: string
        price: number
        event_type: string
        available_seats: number
        total_seats: number
    }
}

export default function Dashboard() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [itemsPerPage] = useState(3)
    const [hasMore, setHasMore] = useState(true)


    // Stats State
    const [stats, setStats] = useState({
        total_bookings: 0,
        upcoming_events: 0
    })

    useEffect(() => {
        fetchBookings()
        fetchStats()
    }, [page])

    const fetchStats = async () => {
        const token = localStorage.getItem("token")
        if (!token) return
        try {
            const response = await api.get("/api/bookings/my-stats")
            setStats(response.data)
        } catch (error) {
            console.error("Error fetching stats")
        }
    }

    const fetchBookings = async () => {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            const skip = (page - 1) * itemsPerPage
            // Limit + 1 strategy
            const response = await api.get(`/api/bookings/my-bookings?skip=${skip}&limit=${itemsPerPage + 1}`)
            setHasMore(response.data.length > itemsPerPage)
            setBookings(response.data.slice(0, itemsPerPage))
        } catch (error) {
            console.error("Error fetching bookings")
        } finally {
            setLoading(false)
        }
    }

    const getImageUrl = (imageId?: string) => {
        if (!imageId) return "https://images.unsplash.com/photo-1459749411177-2a25413f312f?w=800&auto=format&fit=crop&q=60"
        return `${import.meta.env.VITE_API_URL}/media/${imageId}`
    }

    const handleCancelBooking = async (bookingId: number) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return

        try {
            await api.post(`/api/bookings/${bookingId}/cancel`, {})
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: "CANCELLED_BY_USER" } : b
            ))
            fetchStats()
        } catch (error) {
            console.error("Failed to cancel booking")
        }
    }

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
    }

    const getStatusVariant = (status: string) => {
        if (status.includes("CANCELLED")) return "destructive"
        if (status === "CONFIRMED") return "default"
        return "secondary"
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Column: Stats & Actions */}
            <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Bookings</span>
                            <span className="font-bold text-lg">{stats.total_bookings}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Upcoming Events</span>
                            <span className="font-bold text-lg text-primary">{stats.upcoming_events}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button asChild variant="outline" className="w-full justify-start h-11 border-dashed hover:border-solid">
                            <Link to="/">Find New Events</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Ticket List */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold flex items-center text-primary">
                    <Ticket className="mr-2 h-6 w-6" /> Your Tickets
                </h2>

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center bg-muted/20">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm">
                            <Ticket className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-6 text-xl font-semibold">No bookings found</h3>
                        <p className="mb-6 max-w-sm text-muted-foreground">
                            {page === 1 ? "You haven't booked any events yet." : "No more bookings on this page."}
                        </p>
                        {page === 1 && (
                            <Button asChild variant="default" size="lg">
                                <Link to="/">Explore Events</Link>
                            </Button>
                        )}
                        {page > 1 && (
                            <Button variant="outline" onClick={() => setPage(p => p - 1)}>
                                Go Back
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => {
                            const eventDate = new Date(booking.event.date)
                            const totalPrice = (booking.event.price * booking.number_of_seats).toFixed(2)

                            return (
                                <Card key={booking.id} className="overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow">
                                    {/* Image Section */}
                                    <div className="sm:w-64 h-48 sm:h-auto relative bg-muted shrink-0">
                                        <img
                                            src={getImageUrl(booking.event.image_id)}
                                            alt={booking.event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <Badge className="bg-primary/90 hover:bg-primary">{booking.event.event_type}</Badge>
                                                <Badge variant={getStatusVariant(booking.status)} className={
                                                    booking.status === "CONFIRMED" ? "bg-green-600 hover:bg-green-700" : ""
                                                }>
                                                    {formatStatus(booking.status)}
                                                </Badge>
                                            </div>

                                            <h3 className="text-xl font-bold tracking-tight">{booking.event.title}</h3>

                                            <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                                                    {eventDate.toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-2 text-primary/70" />
                                                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center col-span-2 sm:col-span-1">
                                                    <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                                                    {booking.event.location}
                                                </div>
                                                <div className="flex items-center">
                                                    <Armchair className="w-4 h-4 mr-2 text-primary/70" />
                                                    {booking.number_of_seats} Seats
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-between items-center border-t pt-4">
                                            <span className="font-bold text-lg">Total: ${totalPrice}</span>
                                            {booking.status === "CONFIRMED" && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}

                        {/* Pagination Controls */}
                        <div className="flex justify-center items-center space-x-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-32"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground">
                                Page {page}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore}
                                className="w-32"
                            >
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
