import { useEffect, useState } from "react"
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
    ScrollArea
} from "@/components/ui/scroll-area"
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
import { useToast } from "@/components/ui/use-toast"
import { Plus, BarChart3, Calendar, FileText, UploadCloud, Edit, Trash2 } from "lucide-react"
import { EventCard } from "@/components/EventCard"

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
}

export default function OrganizerDashboard() {
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [publishStatus, setPublishStatus] = useState("DRAFT")

    useEffect(() => {
        fetchMyEvents()
    }, [])

    const fetchMyEvents = async () => {
        const token = localStorage.getItem("token")
        if (!token) return
        try {
            const response = await axios.get("http://localhost:8000/api/events/my-events", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setEvents(response.data)
        } catch (error) {
            console.error("Failed to fetch events")
        }
    }

    const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const token = localStorage.getItem("token")
        const formData = new FormData(e.currentTarget)

        // Append status explicitly based on button click
        formData.append("status", publishStatus)

        try {
            await axios.post("http://localhost:8000/api/events/", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            })
            toast({
                title: publishStatus === "PUBLISHED" ? "Event Published!" : "Draft Saved",
                description: publishStatus === "PUBLISHED" ? "Your event is now live." : "You can publish it later."
            })
            setOpen(false)
            fetchMyEvents()
        } catch (error) {
            toast({ title: "Failed to create event", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const totalRevenue = events.reduce((acc, event) => acc + ((event.total_seats - event.available_seats) * event.price), 0)
    const ticketsSold = events.reduce((acc, event) => acc + (event.total_seats - event.available_seats), 0)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Organizer Studio</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Manage your events and track performance.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
                            <Plus className="mr-2 h-5 w-5" /> Create New Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] h-[85vh]">
                        <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                            <DialogDescription>
                                Launch a new experience for your audience.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-full pr-4">
                            <form onSubmit={handleCreateEvent} className="space-y-6 px-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="title" className="text-base">Event Title</Label>
                                    <Input id="title" name="title" required placeholder="Ex: Tech Conference 2025" className="h-12" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select name="event_type" defaultValue="CONFERENCE">
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
                                        <Label htmlFor="date">Date & Time</Label>
                                        <Input id="date" name="date" type="datetime-local" required className="h-12" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" required placeholder="Ex: Convention Center" className="h-12" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="total_seats">Capacity</Label>
                                        <Input id="total_seats" name="total_seats" type="number" required min="1" className="h-12" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input id="price" name="price" type="number" required min="0" step="0.01" className="h-12" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="image_url">Cover Image URL</Label>
                                    <Input id="image_url" name="image_url" placeholder="https://..." className="h-12" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" placeholder="Event details..." className="min-h-[100px]" />
                                </div>
                                <DialogFooter className="pt-4 flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        className="w-full flex-1"
                                        disabled={isLoading}
                                        onClick={() => setPublishStatus("DRAFT")}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> Save Draft
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full flex-1"
                                        disabled={isLoading}
                                        onClick={() => setPublishStatus("PUBLISHED")}
                                    >
                                        <UploadCloud className="mr-2 h-4 w-4" /> Publish Event
                                    </Button>
                                </DialogFooter>
                            </form>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Total Revenue</CardTitle>
                        <span className="font-bold text-primary">$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">{ticketsSold}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across {events.length} events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">{events.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events Grid */}
            <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">Your Events</h3>
                {events.length === 0 ? (
                    <div className="flex bg-muted/40 h-[200px] rounded-xl border-dashed border-2 flex-col items-center justify-center text-muted-foreground">
                        <p>No events launched yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                variant="organizer"
                                action={
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Edit className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" className="w-full">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
