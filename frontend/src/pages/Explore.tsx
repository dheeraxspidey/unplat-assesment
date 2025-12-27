import { useEffect, useState } from "react"
import axios from "axios"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
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
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [selectedType, setSelectedType] = useState("ALL")

    // Pagination
    const [page, setPage] = useState(1)
    const [itemsPerPage] = useState(8) // 4 columns x 2 rows
    const [hasMore, setHasMore] = useState(true)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1) // Reset page on new search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        fetchEvents()
    }, [debouncedSearch, selectedType, page])

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const skip = (page - 1) * itemsPerPage
            let url = `http://localhost:8000/api/events/?status=PUBLISHED&skip=${skip}&limit=${itemsPerPage}`

            if (selectedType !== "ALL") {
                url += `&type=${selectedType}`
            }
            if (debouncedSearch) {
                url += `&search=${debouncedSearch}`
            }

            const response = await axios.get(url)

            setEvents(response.data)
            // If we got fewer items than requested, we've reached the end
            setHasMore(response.data.length === itemsPerPage)

        } catch (error) {
            console.error("Failed to fetch events", error)
        } finally {
            setLoading(false)
        }
    }

    const handleTabChange = (type: string) => {
        setSelectedType(type)
        setPage(1)
    }

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
                    <Button size="lg" className="rounded-full px-8" onClick={() => fetchEvents()}>Search</Button>
                </div>
            </section>

            {/* Categories & List */}
            <Tabs defaultValue="ALL" className="w-full" onValueChange={handleTabChange}>
                <div className="flex items-center justify-between pb-4 overflow-x-auto">
                    <TabsList className="h-12 bg-muted/50 p-1">
                        <TabsTrigger value="ALL" className="h-full px-6 rounded-sm">All Events</TabsTrigger>
                        <TabsTrigger value="CONCERT" className="h-full px-6 rounded-sm">Concerts</TabsTrigger>
                        <TabsTrigger value="CONFERENCE" className="h-full px-6 rounded-sm">Conferences</TabsTrigger>
                        <TabsTrigger value="WORKSHOP" className="h-full px-6 rounded-sm">Workshops</TabsTrigger>
                        <TabsTrigger value="THEATER" className="h-full px-6 rounded-sm">Theater</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={selectedType} className="mt-0 space-y-8">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {events.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>

                            {events.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                                    <Search className="h-12 w-12 mb-4 opacity-20" />
                                    <h3 className="text-xl font-semibold">No events found</h3>
                                    <p>Try adjusting your search or filters.</p>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {events.length > 0 && (
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
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
