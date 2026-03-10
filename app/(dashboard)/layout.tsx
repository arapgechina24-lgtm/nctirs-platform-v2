import { AuthProvider } from "@/contexts/nctirs/AuthContext"
import Providers from "@/components/Providers"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Providers>
            <AuthProvider>
                <div className="flex h-screen w-full bg-black text-green-500 overflow-hidden relative font-mono">
                    {children}
                </div>
            </AuthProvider>
        </Providers>
    )
}
