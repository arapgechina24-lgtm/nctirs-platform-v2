"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                badgeId: formData.email, // Passing email to the badgeId field expected by src/auth.ts
                password: formData.password,
                redirect: false
            })

            if (result?.error) {
                toast.error("Invalid credentials. Please verify your Security Clearance.")
                return
            }

            toast.success("Authentication successful. Welcome to NSSPIP.")
            router.push("/")
            router.refresh()
        } catch (error) {
            toast.error("An unexpected error occurred during authentication.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                            <Button variant="outline" className="w-full" type="button">
                                Login with Google
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <a href="/register" className="underline underline-offset-4">
                                Sign up
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
