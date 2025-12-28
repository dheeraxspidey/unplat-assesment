import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Camera } from "lucide-react"
import api from "@/lib/api"

interface ProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProfileUpdate: () => void
}

interface UserProfile {
    id: number
    email: string
    full_name: string
    profile_image_id?: string
    role: string
}

export function ProfileDialog({ open, onOpenChange, onProfileUpdate }: ProfileDialogProps) {
    const { toast } = useToast()
    const [user, setUser] = useState<UserProfile | null>(null)

    const [isSaving, setIsSaving] = useState(false)

    // Profile Form State
    const [fullName, setFullName] = useState("")
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Password Form State
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        if (open) {
            fetchProfile()
        }
    }, [open])

    const fetchProfile = async () => {
        try {

            const response = await api.get("/api/auth/me")
            setUser(response.data)
            setFullName(response.data.full_name || "")
            setPreviewImage(null) // Reset preview
        } catch (error) {
            console.error("Failed to fetch profile", error)
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const formData = new FormData()
            formData.append("full_name", fullName)

            if (fileInputRef.current?.files?.[0]) {
                formData.append("image_file", fileInputRef.current.files[0])
            }

            await api.put("/api/auth/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })

            toast({ title: "Success", description: "Profile updated successfully" })
            onProfileUpdate()
            // Don't close, just refresh data
            fetchProfile()
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
            return
        }

        setIsSaving(true)
        try {
            await api.post("/api/auth/change-password", {
                old_password: oldPassword,
                new_password: newPassword
            })
            toast({ title: "Success", description: "Password changed successfully" })
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to change password",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const getAvatarSrc = () => {
        if (previewImage) return previewImage
        if (user?.profile_image_id) return `${import.meta.env.VITE_API_URL}/media/${user.profile_image_id}`
        return `https://robohash.org/${user?.email}.png?set=set4&size=128x128`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                    <DialogDescription>
                        Manage your profile and security settings.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 py-4">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
                                        <AvatarImage src={getAvatarSrc()} className="object-cover" />
                                        <AvatarFallback>
                                            {user?.email.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">Click to upload new avatar</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 py-4">
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Current Password</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
