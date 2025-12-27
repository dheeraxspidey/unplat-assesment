import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Event {
    id: number
    title: string
    description: string
    date: string
    location: string
    total_seats: number
    available_seats: number
    price: number
    image_id?: string
    event_type: string
}

export default function EventDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [bookingLoading, setBookingLoading] = useState(false)
    const { toast } = useToast()

    const [seats, setSeats] = useState(1)

    useEffect(() => {
        fetchEvent()
    }, [id])

    const fetchEvent = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/events/?status=PUBLISHED")
            const found = response.data.find((e: Event) => e.id === Number(id))
            setEvent(found || null)
        } catch (error) {
            console.error("Error fetching event")
        } finally {
            setLoading(false)
        }
    }

    const handleBook = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            toast({ title: "Please login to book", variant: "destructive" })
            navigate("/login")
            return
        }

        setBookingLoading(true)
        try {
            await axios.post("http://localhost:8000/api/bookings/", {
                event_id: Number(id),
                number_of_seats: seats
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast({ title: "Booking successful!", description: "Check your dashboard for the ticket." })
            navigate("/dashboard")
        } catch (error: any) {
            toast({ title: "Booking failed", description: error.response?.data?.detail || "Could not book tickets.", variant: "destructive" })
        } finally {
            setBookingLoading(false)
        }
    }

    const getImageUrl = (imageId?: string) => {
        if (!imageId) return "https://images.unsplash.com/photo-1459749411177-2a25413f312f?w=800&auto=format&fit=crop&q=60"
        return `http://localhost:8000/media/${imageId}`
    }

    if (loading) return <div className="p-8 text-center">Loading event...</div>
    if (!event) return <div className="p-8 text-center">Event not found.</div>

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate("/")} className="pl-0 hover:bg-transparent hover:underline flex items-center">
                    ← Back to Events
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-xl border bg-muted">
                    <img
                        src={getImageUrl(event.image_id)}
                        alt={event.title}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="space-y-6">
                    <div>
                        <Badge className="mb-2">{event.event_type}</Badge>
                        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{event.title}</h1>
                        <div className="mt-2 flex items-center text-muted-foreground">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{event.location}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Availability</p>
                                <p className="font-medium">{event.available_seats} / {event.total_seats}</p>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Number of Seats</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={event.available_seats}
                                    value={seats}
                                    onChange={(e) => setSeats(Math.min(Number(e.target.value), event.available_seats))}
                                    className="w-20 rounded-md border p-1 text-center"
                                />
                            </div>
                            <div className="flex justify-between">
                                <span>Standard Ticket x {seats}</span>
                                <span>${(event.price * seats).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>${(event.price * seats).toFixed(2)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {localStorage.getItem("role") === "ORGANIZER" ? (
                                <Button className="w-full" size="lg" disabled>
                                    Organizers cannot book tickets
                                </Button>
                            ) : (
                                <Button className="w-full" size="lg" onClick={handleBook} disabled={bookingLoading || event.available_seats <= 0}>
                                    {bookingLoading ? "Processing..." : (event.available_seats > 0 ? "Book Tickets" : "Sold Out")}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    <div className="rounded-lg bg-muted p-4">
                        <h3 className="mb-2 font-semibold">About Event</h3>
                        <p className="text-sm text-muted-foreground">{event.description || "No description provided."}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
