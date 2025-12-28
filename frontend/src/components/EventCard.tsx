import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from "lucide-react"
import { Link } from "react-router-dom"

interface EventCardProps {
    event: {
        id: number
        title: string
        date: string
        location: string
        price: number
        image_id?: string
        available_seats?: number
        total_seats?: number
        status?: string // PUBLISHED, DRAFT, etc.
        event_type?: string
    }
    action?: React.ReactNode
    variant?: "default" | "organizer" | "booking"
}

// Helper: Get Image URL
const getImageUrl = (imageId?: string) => {
    if (!imageId) return "https://images.unsplash.com/photo-1459749411177-2a25413f312f?w=800&auto=format&fit=crop&q=60"
    return `${import.meta.env.VITE_API_URL}/media/${imageId}`
}

export function EventCard({ event, action, variant = "default" }: EventCardProps) {
    const isSoldOut = (event.available_seats || 0) <= 0
    const dateStr = new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-xl hover:border-primary/50 flex flex-col h-full border-muted-foreground/20">
            {/* Image Section */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <img
                    src={getImageUrl(event.image_id)}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/50 font-semibold">
                        {event.event_type}
                    </Badge>
                    {variant === "organizer" && (
                        <Badge variant={event.status === "PUBLISHED" ? "default" : "destructive"}>
                            {event.status}
                        </Badge>
                    )}
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="line-clamp-1 text-lg font-bold group-hover:text-primary transition-colors">
                            {event.title}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1 text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-primary">${event.price}</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 flex-grow space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span>{dateStr}</span>
                </div>

                {variant !== "booking" && (
                    <div className="flex items-center justify-between text-sm mt-2">
                        <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            <span>
                                {variant === "organizer"
                                    ? `${event.available_seats}/${event.total_seats} Available`
                                    : `${event.available_seats} seats left`
                                }
                            </span>
                        </div>
                    </div>
                )}

                {/* Availability Bar for Organizer */}
                {variant === "organizer" && event.total_seats && event.available_seats !== undefined && (
                    <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${((event.total_seats - event.available_seats) / event.total_seats) * 100}%` }}
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                {action ? action : (
                    <Button asChild className="w-full" variant={isSoldOut ? "ghost" : "default"} disabled={isSoldOut}>
                        <Link to={`/event/${event.id}`}>
                            {isSoldOut ? "Sold Out" : "View Details"}
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
