import { useEffect, useState } from "react"
import axios from "axios"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EventCard } from "@/components/EventCard"

interface Event {
    id: number
    title: string
    date: string
    location: string
    price: number
    image_id?: string
    event_type: string
    available_seats: number
}

export default function Explore() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async (type?: string) => {
        setLoading(true)
        try {
            let url = "http://localhost:8000/api/events/?status=PUBLISHED"
            if (type && type !== "ALL") {
                url += `&type=${type}`
            }
            const response = await axios.get(url)
            setEvents(response.data)
        } catch (error) {
            console.error("Failed to fetch events", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center space-y-6 pt-12 pb-8 text-center bg-gradient-to-b from-primary/5 to-transparent rounded-3xl border border-primary/10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-primary">
                        Find Your Vibe.
                    </h1>
                    <p className="max-w-[700px] text-lg text-muted-foreground mx-auto">
                        Discover the best concerts, workshops, and gatherings happening now.
                    </p>
                </div>

                <div className="flex w-full max-w-lg items-center space-x-2 bg-background p-2 rounded-full border shadow-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search events, locations..."
                            className="pl-10 border-none shadow-none focus-visible:ring-0 text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="lg" className="rounded-full px-8">Search</Button>
                </div>
            </section>

            {/* Categories & List */}
            <Tabs defaultValue="ALL" className="w-full" onValueChange={fetchEvents}>
                <div className="flex items-center justify-between pb-4 overflow-x-auto">
                    <TabsList className="h-12 bg-muted/50 p-1">
                        <TabsTrigger value="ALL" className="h-full px-6 rounded-sm">All Events</TabsTrigger>
                        <TabsTrigger value="CONCERT" className="h-full px-6 rounded-sm">Concerts</TabsTrigger>
                        <TabsTrigger value="CONFERENCE" className="h-full px-6 rounded-sm">Conferences</TabsTrigger>
                        <TabsTrigger value="WORKSHOP" className="h-full px-6 rounded-sm">Workshops</TabsTrigger>
                        <TabsTrigger value="THEATER" className="h-full px-6 rounded-sm">Theater</TabsTrigger>
                    </TabsList>
                </div>

                {["ALL", "CONCERT", "CONFERENCE", "WORKSHOP", "THEATER"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-0">
                        {loading ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredEvents.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                                {filteredEvents.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center">
                                        <Search className="h-12 w-12 mb-4 opacity-20" />
                                        <h3 className="text-xl font-semibold">No events found</h3>
                                        <p>Try adjusting your search or filters.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
