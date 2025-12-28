import { useState } from "react"
import api from "@/lib/api"
import { useForm } from "react-hook-form"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Lock, Mail } from "lucide-react"

export default function Login() {
    const { register, handleSubmit } = useForm()
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { toast } = useToast()

    const parseJwt = (token: string) => {
        try {
            return JSON.parse(atob(token.split('.')[1]))
        } catch (e) {
            return null
        }
    }

    const onSubmit = async (data: any) => {
        setLoading(true)
        const formData = new URLSearchParams()
        formData.append("username", data.email)
        formData.append("password", data.password)

        try {
            const response = await api.post("/api/auth/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })

            const token = response.data.access_token
            localStorage.setItem("token", token)

            const decoded = parseJwt(token)
            const role = decoded?.role || "ATTENDEE"
            localStorage.setItem("role", role)

            toast({ title: "Welcome back!", description: "Logged in successfully.", duration: 2000 })

            if (role === "ORGANIZER") {
                navigate("/organizer")
            } else {
                navigate("/")
            }

        } catch (error) {
            toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-muted/40 animate-in fade-in duration-500">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" placeholder="m@example.com" className="pl-10 h-10" {...register("email", { required: true })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="password" type="password" className="pl-10 h-10" {...register("password", { required: true })} />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-10" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-muted-foreground">
                        Don't have an account? <Link to="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
