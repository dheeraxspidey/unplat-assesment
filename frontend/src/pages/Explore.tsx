import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Search, ChevronLeft, ChevronRight, CalendarIcon, Compass } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { EventCard } from "@/components/EventCard"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null })
    const [filterLabel, setFilterLabel] = useState<string | null>(null)

    // Pagination
    const [page, setPage] = useState(1)
    const [itemsPerPage] = useState(8) // 4 columns x 2 rows
    const [hasMore, setHasMore] = useState(true)

    const setDateFilter = (type: 'TODAY' | 'TOMORROW' | 'WEEKEND') => {
        const start = new Date();
        const end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (type === 'TOMORROW') {
            start.setDate(start.getDate() + 1);
            end.setDate(end.getDate() + 1);
        } else if (type === 'WEEKEND') {
            const day = start.getDay();
            const diff = 6 - day; // Saturday
            start.setDate(start.getDate() + diff);
            end.setDate(end.getDate() + diff + 1); // Sunday
            // If today is Sunday, this logic targets next week. Simple weekend logic: Next Sat/Sun
            // Or current weekend if Fri/Sat/Sun?
            // Let's stick to upcoming Saturday/Sunday logic
        }
        setDateRange({ start, end });
        setFilterLabel(type === 'WEEKEND' ? "This Weekend" : (type === 'TODAY' ? "Today" : "Tomorrow"));
        setPage(1);
    }

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
    }, [debouncedSearch, selectedType, page, dateRange])

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const skip = (page - 1) * itemsPerPage
            const token = localStorage.getItem("token")
            let response

            if (selectedType === "FOR_YOU") {
                if (!token) {
                    // Creating a "Login to see recommendations" placeholder effect by returning empty for now
                    // Or could redirect.
                    response = { data: [] }
                } else {
                    response = await api.get(`/api/events/recommendations?limit=3`)
                }
            } else {
                let url = `/api/events/?status=PUBLISHED&skip=${skip}&limit=${itemsPerPage + 1}`

                if (selectedType !== "ALL") {
                    url += `&type=${selectedType}`
                }
                if (debouncedSearch) {
                    url += `&search=${debouncedSearch}`
                }
                if (dateRange.start) {
                    url += `&start_date=${dateRange.start.toISOString()}`
                }
                if (dateRange.end) {
                    url += `&end_date=${dateRange.end.toISOString()}`
                }
                response = await api.get(url)
            }

            // setEvents(response.data) -- logic continues below with pagination update

            setHasMore(response.data.length > itemsPerPage)
            setEvents(response.data.slice(0, itemsPerPage))

        } catch (error: any) {
            console.error("Failed to fetch events", error)
            setEvents([])
            if (error.response && error.response.status === 401) {
                // Token invalid/expired
                localStorage.clear()
                // Optional: window.location.href = '/login' or let the user handle it
            }
        } finally {
            setLoading(false)
        }
    }

    const handleTabChange = (type: string) => {
        setEvents([])
        setSelectedType(type)
        setPage(1)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center space-y-6 pt-12 pb-8 text-center bg-gradient-to-b from-primary/5 to-transparent rounded-3xl border border-primary/10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl text-primary font-tagesschrift">
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
            <Tabs value={selectedType} className="w-full" onValueChange={handleTabChange}>
                <div className="flex items-center justify-between pb-4 overflow-x-auto gap-4">
                    <TabsList className="h-12 bg-muted/50 p-1">
                        <TabsTrigger value="ALL" className="h-full px-6 rounded-sm">All Events</TabsTrigger>
                        {localStorage.getItem("role") !== "ORGANIZER" && (
                            <TabsTrigger value="FOR_YOU" className="h-full px-6 rounded-sm font-semibold text-primary inline-flex items-center gap-2">
                                <Compass className="h-4 w-4" /> For You
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="CONCERT" className="h-full px-6 rounded-sm">Concerts</TabsTrigger>
                        <TabsTrigger value="CONFERENCE" className="h-full px-6 rounded-sm">Conferences</TabsTrigger>
                        <TabsTrigger value="WORKSHOP" className="h-full px-6 rounded-sm">Workshops</TabsTrigger>
                        <TabsTrigger value="THEATER" className="h-full px-6 rounded-sm">Theater</TabsTrigger>
                    </TabsList>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-12 gap-2 border-dashed min-w-[140px]">
                                <CalendarIcon className="h-4 w-4" />
                                {filterLabel || "Filter Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end" sideOffset={5}>
                            <div className="flex flex-col sm:flex-row">
                                {/* Preset Options */}
                                <div className="border-r p-3 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Select</p>
                                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDateFilter('TODAY')}>
                                        Today
                                    </Button>
                                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDateFilter('TOMORROW')}>
                                        Tomorrow
                                    </Button>
                                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDateFilter('WEEKEND')}>
                                        This Weekend
                                    </Button>
                                    {filterLabel && (
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => { setDateRange({ start: null, end: null }); setFilterLabel(null); }}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                {/* Calendar */}
                                <div className="p-2">
                                    <Calendar
                                        mode="range"
                                        disabled={{ before: new Date() }}
                                        selected={{
                                            from: dateRange.start || undefined,
                                            to: dateRange.end || undefined
                                        }}
                                        onSelect={(range) => {
                                            if (range?.from) {
                                                setDateRange({ start: range.from, end: range.to || null })
                                                if (range.to) {
                                                    setFilterLabel(`${range.from.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${range.to.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`)
                                                } else {
                                                    setFilterLabel(`From ${range.from.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`)
                                                }
                                            } else {
                                                setDateRange({ start: null, end: null })
                                                setFilterLabel(null)
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
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
