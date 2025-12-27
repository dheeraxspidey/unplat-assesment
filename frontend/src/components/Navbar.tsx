import { Link, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, LayoutDashboard, LogOut, Ticket, Menu } from "lucide-react"

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const token = localStorage.getItem("token")

    // Rudimentary role check - in real app parse JWT
    // For now, if we are on /organizer, we assume organizer context
    // Or we can save role in localStorage on login

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    const parseJwt = (token: string) => {
        try {
            return JSON.parse(atob(token.split('.')[1]))
        } catch (e) {
            return null
        }
    }

    const getUserEmail = () => {
        if (!token) return "user@example.com"
        const decoded = parseJwt(token)
        return decoded?.sub || "user@example.com"
    }

    // For full name we might need to store it or fetch it, 
    // but typically sub is email. Let's use email for now.

    const role = localStorage.getItem("role")
    const userEmail = getUserEmail()

    const isActive = (path: string) => location.pathname === path

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <div className="mr-8 hidden md:flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <div className="bg-primary text-primary-foreground rounded-lg p-1">
                            <Ticket className="h-5 w-5" />
                        </div>
                        <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
                            Event<span className="text-primary">Flow</span>
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            to="/"
                            className={`transition-colors hover:text-foreground/80 ${isActive('/') ? 'text-primary font-bold' : 'text-foreground/60'}`}
                        >
                            Explore
                        </Link>

                        {token && role === "ATTENDEE" && (
                            <Link
                                to="/dashboard"
                                className={`transition-colors hover:text-foreground/80 ${isActive('/dashboard') ? 'text-primary font-bold' : 'text-foreground/60'}`}
                            >
                                My Bookings
                            </Link>
                        )}

                        {token && role === "ORGANIZER" && (
                            <Link
                                to="/organizer"
                                className={`transition-colors hover:text-foreground/80 ${isActive('/organizer') ? 'text-primary font-bold' : 'text-foreground/60'}`}
                            >
                                Organizer Studio
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="md:hidden flex items-center mr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px] bg-background">
                            <DropdownMenuItem onClick={() => navigate("/")}>
                                Explore
                            </DropdownMenuItem>
                            {token && role === "ATTENDEE" && (
                                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                                    My Bookings
                                </DropdownMenuItem>
                            )}
                            {token && role === "ORGANIZER" && (
                                <DropdownMenuItem onClick={() => navigate("/organizer")}>
                                    Organizer Studio
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Link to="/" className="ml-2 flex items-center space-x-2">
                        <div className="bg-primary text-primary-foreground rounded-lg p-1">
                            <Ticket className="h-5 w-5" />
                        </div>
                        <span className="font-bold inline-block text-lg tracking-tight">
                            Event<span className="text-primary">Flow</span>
                        </span>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    {token ? (
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/10">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={`https://robohash.org/${userEmail}.png?set=set4&size=128x128`} alt="@user" />
                                            <AvatarFallback className="bg-primary/5 text-primary">
                                                {userEmail.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">Account</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {userEmail}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {role === "ATTENDEE" && (
                                        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                                            <LayoutDashboard className="mr-2 h-4 w-4" /> My Bookings
                                        </DropdownMenuItem>
                                    )}
                                    {role === "ORGANIZER" && (
                                        <DropdownMenuItem onClick={() => navigate("/organizer")}>
                                            <CalendarDays className="mr-2 h-4 w-4" /> Organizer Studio
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" /> Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
                            <Button onClick={() => navigate("/signup")} className="rounded-full px-6">Get Started</Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
