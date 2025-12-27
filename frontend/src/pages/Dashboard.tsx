import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Ticket, Star, Trophy } from "lucide-react"
import { EventCard } from "@/components/EventCard"

interface Booking {
    id: number
    event_id: number
    status: string
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

    useEffect(() => {
        fetchBookings()
    }, [])

    const fetchBookings = async () => {
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            const response = await axios.get("http://localhost:8000/api/bookings/my-bookings", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setBookings(response.data)
        } catch (error) {
            console.error("Error fetching bookings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                    <p className="text-muted-foreground">Manage your tickets and rewards.</p>
                </div>
                <Button asChild size="lg" className="rounded-full">
                    <Link to="/">Find New Events</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Total Bookings</CardTitle>
                        <Ticket className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{bookings.length}</div>
                        <p className="text-xs opacity-70 mt-1">Lifetime tickets purchased</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">1,250</div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">+250 from last event</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Star className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">Gold</div>
                        <p className="text-xs text-muted-foreground mt-1">Top 5% of attendees</p>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-2" />

            <section>
                <h3 className="text-2xl font-semibold mb-6 flex items-center">
                    <Ticket className="mr-2 h-6 w-6 text-primary" /> Your Tickets
                </h3>

                {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center bg-muted/20">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm">
                            <Ticket className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-6 text-xl font-semibold">No tickets yet</h3>
                        <p className="mb-6 max-w-sm text-muted-foreground">
                            You haven't booked any events. Explore our curated list of upcoming events to get started.
                        </p>
                        <Button asChild variant="outline" size="lg">
                            <Link to="/">Explore Events</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {bookings.map((booking) => (
                            <EventCard
                                key={booking.id}
                                event={booking.event}
                                variant="booking"
                                action={
                                    <div className="space-y-2 w-full">
                                        <Button className="w-full" variant="outline">
                                            View Ticket #{booking.id}
                                        </Button>
                                        <div className="flex justify-center">
                                            <Badge variant={booking.status === "CONFIRMED" ? "default" : "destructive"} className="uppercase text-[10px] tracking-wider">
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    </div>
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
