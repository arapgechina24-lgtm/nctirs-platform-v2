import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`min-h-screen bg-background ${inter.className}`}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
                    <div className="w-full max-w-md space-y-8">
                        {children}
                    </div>
                </main>
            </ThemeProvider>
        </div>
    )
}
