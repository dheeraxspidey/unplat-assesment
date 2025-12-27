import { useState } from "react"
import axios from "axios"
import { useForm } from "react-hook-form"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Lock, Mail, User, Shield } from "lucide-react"

export default function Signup() {
    const { register, handleSubmit, setValue } = useForm()
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()

    const onSubmit = async (data: any) => {
        setLoading(true)
        try {
            await axios.post("http://localhost:8000/api/auth/signup", data)
            toast({ title: "Account created", description: "Please login with your new credentials." })
            navigate("/login")
        } catch (error) {
            toast({ title: "Signup Failed", description: "Email might be already in use.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 animate-in fade-in duration-500">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
                    <CardDescription className="text-center">Start your journey with us</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="full_name" placeholder="John Doe" className="pl-10" {...register("full_name", { required: true })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" placeholder="m@example.com" className="pl-10" {...register("email", { required: true })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="password" type="password" className="pl-10" {...register("password", { required: true })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">I want to...</Label>
                            <Select onValueChange={(val) => setValue("role", val)} defaultValue="ATTENDEE">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ATTENDEE">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2" /> Book Tickets (Attendee)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ORGANIZER">
                                        <div className="flex items-center">
                                            <Shield className="w-4 h-4 mr-2" /> Organize Events (Organizer)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-primary hover:underline font-semibold">Log in</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
