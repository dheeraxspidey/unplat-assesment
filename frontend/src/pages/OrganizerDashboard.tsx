import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Plus, BarChart3, Calendar as CalendarIcon, FileText, UploadCloud, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, X, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Event {
    id: number
    title: string
    date: string
    location: string
    total_seats: number
    available_seats: number
    price: number
    status: string
    event_type: string
    image_id: string
    description: string
}

export default function OrganizerDashboard() {
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [eventToCancel, setEventToCancel] = useState<Event | null>(null)
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Date & Time State for Create Event
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [time, setTime] = useState("12:00")
    // State to control calendar popover visibility
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    // Track intended status for event creation
    const [submitStatus, setSubmitStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFileName(e.target.files[0].name)
        }
    }

    const removeSelectedFile = () => {
        setSelectedFileName(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Pagination State
    const [page, setPage] = useState(1)
    const [itemsPerPage] = useState(7)
    const [hasMore, setHasMore] = useState(true)

    // Sort State
    const [sortBy, setSortBy] = useState("date")
    const [sortDesc, setSortDesc] = useState(false)

    // Stats State
    const [stats, setStats] = useState({
        total_events: 0,
        tickets_sold: 0,
        total_revenue: 0,
        active_events: 0
    })

    useEffect(() => {
        fetchMyEvents()
        fetchStats()
    }, [page, sortBy, sortDesc])

    const fetchStats = async () => {
        const token = localStorage.getItem("token")
        if (!token) return
        try {
            const response = await axios.get("http://localhost:8000/api/events/stats/overview", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStats(response.data)
        } catch (error) {
            console.error("Failed to fetch stats")
        }
    }

    const fetchMyEvents = async () => {
        const token = localStorage.getItem("token")
        if (!token) return
        try {
            const skip = (page - 1) * itemsPerPage
            const response = await axios.get(`http://localhost:8000/api/events/my-events?skip=${skip}&limit=${itemsPerPage + 1}&sort_by=${sortBy}&sort_desc=${sortDesc}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setHasMore(response.data.length > itemsPerPage)
            setEvents(response.data.slice(0, itemsPerPage))
        } catch (error) {
            console.error("Failed to fetch events")
        }
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDesc(!sortDesc)
        } else {
            setSortBy(field)
            setSortDesc(false)
        }
        setPage(1)
    }

    const getImageUrl = (imageId?: string) => {
        if (!imageId) return "https://images.unsplash.com/photo-1459749411177-2a25413f312f?w=800&auto=format&fit=crop&q=60"
        return `http://localhost:8000/media/${imageId}`
    }

    const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const token = localStorage.getItem("token")

        // Use state-based status
        const status = submitStatus;

        const formData = new FormData(e.currentTarget)
        formData.set("status", status)

        // Handle Date & Time manually
        if (date) {
            const dateStr = format(date, "yyyy-MM-dd")
            const dateTime = new Date(`${dateStr}T${time}`)
            formData.set("date", dateTime.toISOString())
        }

        try {
            await axios.post("http://localhost:8000/api/events/", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            toast({
                title: status === "PUBLISHED" ? "Event Published!" : "Draft Saved",
                description: status === "PUBLISHED" ? "Your event is now live." : "You can publish it later."
            })
            setOpen(false)
            // Reset form state
            setSelectedFileName(null)
            setDate(undefined)
            setTime("12:00")
            if (fileInputRef.current) fileInputRef.current.value = ""
            fetchMyEvents()
        } catch (error) {
            toast({ title: "Failed to create event", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingEvent) return
        setIsLoading(true)
        const token = localStorage.getItem("token")

        const formData = new FormData(e.currentTarget)
        const data = {
            title: formData.get("title"),
            event_type: formData.get("event_type"),
            date: formData.get("date"),
            location: formData.get("location"),
            total_seats: Number(formData.get("total_seats")),
            price: Number(formData.get("price")),
            description: formData.get("description"),
        }

        try {
            await axios.put(`http://localhost:8000/api/events/${editingEvent.id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            toast({ title: "Event Updated", description: "Your changes have been saved." })
            setIsEditOpen(false)
            setEditingEvent(null)
            fetchMyEvents()
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.detail || "Could not update event",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuickPublish = async (event: Event) => {
        const token = localStorage.getItem("token")
        try {
            await axios.put(`http://localhost:8000/api/events/${event.id}`,
                { status: "PUBLISHED" },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            )
            toast({ title: "Event Published", description: `${event.title} is now live.` })
            fetchMyEvents()
        } catch (error) {
            toast({ title: "Failed to publish", variant: "destructive" })
        }
    }

    const openCancelDialog = (event: Event) => {
        setEventToCancel(event)
    }

    const onConfirmCancelEvent = async () => {
        if (!eventToCancel) return

        const token = localStorage.getItem("token")
        try {
            await axios.delete(`http://localhost:8000/api/events/${eventToCancel.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast({ title: "Event Cancelled", description: "The event has been cancelled." })
            fetchMyEvents()
            setEventToCancel(null)
        } catch (error) {
            toast({ title: "Failed to cancel event", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organizer Studio</h2>
                    <p className="text-muted-foreground">Manage your events and track performance.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                            <Plus className="mr-2 h-5 w-5" /> Create Event
                        </Button>
                    </DialogTrigger>
                    {/* Increased width to max-w-3xl (approx 768px/48rem) for better spacing */}
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-2xl">Create New Event</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to launch your next big event.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Added overflow-x-hidden to prevent horizontal scrolling */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            <div className="p-6 pt-2">
                                <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="image">Event Cover Image</Label>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-center w-full">
                                                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                                            <div className="text-sm text-muted-foreground text-center">
                                                                {selectedFileName ? (
                                                                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                                                        {selectedFileName}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                removeSelectedFile();
                                                                            }}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span><span className="font-semibold">Click to upload</span> or drag and drop</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="image-upload"
                                                            name="image_file"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-background px-2 text-muted-foreground">Or using URL</span>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="image_url" className="sr-only">Image URL</Label>
                                                    <Input
                                                        id="image_url"
                                                        name="image_url"
                                                        placeholder="Paste image URL here (https://...)"
                                                        disabled={!!selectedFileName}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Event Title</Label>
                                            <Input id="title" name="title" placeholder="e.g. Neon Dreams Concert" required className="h-12" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="type">Event Type</Label>
                                                <Select name="event_type" defaultValue="CONCERT">
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CONCERT">Concert</SelectItem>
                                                        <SelectItem value="CONFERENCE">Conference</SelectItem>
                                                        <SelectItem value="WORKSHOP">Workshop</SelectItem>
                                                        <SelectItem value="THEATER">Theater</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Date & Time</Label>
                                                <div className="flex gap-2">
                                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal h-12",
                                                                    !date && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar
                                                                mode="single"
                                                                selected={date}
                                                                onSelect={(newDate) => {
                                                                    setDate(newDate)
                                                                    setIsCalendarOpen(false)
                                                                }}
                                                                initialFocus
                                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <Input
                                                        type="time"
                                                        value={time}
                                                        onChange={(e) => setTime(e.target.value)}
                                                        className="w-[120px] h-12"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input id="location" name="location" placeholder="Venue address" required className="h-12" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="seats">Total Seats</Label>
                                                <Input id="seats" name="total_seats" type="number" required min="1" defaultValue="1" className="h-12" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="price">Price ($)</Label>
                                                <Input id="price" name="price" type="number" required min="0" step="0.01" defaultValue="0" className="h-12" />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" name="description" placeholder="Tell people what this event is about..." className="min-h-[100px]" />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <DialogFooter className="p-6 border-t bg-muted/20 gap-2 sm:justify-between">
                            <Button
                                type="submit"
                                variant="ghost"
                                onClick={() => setSubmitStatus("DRAFT")}
                                form="create-event-form"
                            >
                                Save as Draft
                            </Button>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                                <Button
                                    type="submit"
                                    onClick={() => setSubmitStatus("PUBLISHED")}
                                    form="create-event-form"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {isLoading ? "Publishing..." : "Publish Event"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_events}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.active_events} Active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tickets_sold}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.total_revenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events Visual Table */}
            <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Image</TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort("date")}
                            >
                                <div className="flex items-center gap-1">
                                    Event Details
                                    {sortBy === "date" && (sortDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                                </div>
                            </TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead
                                className="text-center cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Status
                                    {sortBy === "status" && (sortDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-center cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort("sold")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Seats Sold
                                    {sortBy === "sold" && (sortDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-center cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort("price")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Price
                                    {sortBy === "price" && (sortDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No events found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => {
                                const sold = event.total_seats - event.available_seats
                                return (
                                    <TableRow key={event.id} className="hover:bg-muted/5">
                                        <TableCell>
                                            <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                                                <img
                                                    src={getImageUrl(event.image_id)}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-xs text-muted-foreground uppercase mt-1">{event.event_type}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={event.location}>
                                            <div className="text-sm">{event.location}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={
                                                (new Date(event.date) < new Date() && event.status === "PUBLISHED") ? "secondary" :
                                                    (event.status === "PUBLISHED" ? "default" : (event.status === "CANCELLED" ? "destructive" : "secondary"))
                                            }>
                                                {(new Date(event.date) < new Date() && event.status === "PUBLISHED") ? "ENDED" : event.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{sold} / {event.total_seats}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {Math.round((sold / event.total_seats) * 100)}%
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            ${event.price}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {event.status === "DRAFT" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={() => handleQuickPublish(event)}
                                                        title="Publish Event"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingEvent(event)
                                                        setIsEditOpen(true)
                                                    }}
                                                    disabled={event.status === "CANCELLED"}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => openCancelDialog(event)}
                                                    disabled={event.status === "CANCELLED"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm font-medium mx-2">Page {page}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={!hasMore}
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>


            {/* Edit DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>
                            Make changes to your event details here.
                        </DialogDescription>
                    </DialogHeader>
                    {editingEvent && (
                        <div className="flex-1 overflow-y-auto max-h-[80vh] overflow-x-hidden">
                            <form onSubmit={handleUpdateEvent} className="grid gap-6 py-4 px-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-title">Title</Label>
                                    <Input id="edit-title" name="title" defaultValue={editingEvent.title} className="h-12" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <Select name="event_type" defaultValue={editingEvent.event_type}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CONCERT">Concert</SelectItem>
                                                <SelectItem value="CONFERENCE">Conference</SelectItem>
                                                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                                                <SelectItem value="THEATER">Theater</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-date">Date</Label>
                                        <Input id="edit-date" name="date" type="datetime-local" defaultValue={editingEvent.date} className="h-12" required />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-location">Location</Label>
                                    <Input id="edit-location" name="location" defaultValue={editingEvent.location} className="h-12" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-seats">Total Seats</Label>
                                        <Input id="edit-seats" name="total_seats" type="number" required min="1" defaultValue={editingEvent.total_seats} className="h-12" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-price">Price ($)</Label>
                                        <Input id="edit-price" name="price" type="number" required min="0" step="0.01" defaultValue={editingEvent.price} className="h-12" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea id="edit-description" name="description" defaultValue={editingEvent.description} className="min-h-[100px]" />
                                </div>
                                <DialogFooter className="pt-4 sm:justify-end">
                                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isLoading}>
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={!!eventToCancel} onOpenChange={(open) => !open && setEventToCancel(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Cancel Event?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to cancel <strong>{eventToCancel?.title}</strong>?
                            <br /><br />
                            This action cannot be undone. All bookings will be refunded and attendees will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setEventToCancel(null)}>
                            Keep Event
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirmCancelEvent}
                        >
                            Yes, Cancel Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
