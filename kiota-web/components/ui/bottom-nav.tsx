"use client"

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeSvg, PortfolioSvg, GoalsSvg, LearnSvg, SpendingSvg, ProfileSvg } from '@/lib/svg'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/home', icon: HomeSvg, label: 'Home' },
    { href: '/portfolio', icon: PortfolioSvg, label: 'Portfolio' },
    // { href: '/goals', icon: GoalsSvg, label: 'Goals' },
    // { href: '/learn', icon: LearnSvg, label: 'Learn' },
    // { href: '/spending', icon: SpendingSvg, label: 'Spending' },
    { href: '/profile', icon: ProfileSvg, label: 'Profile' },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#14141C] border-t border-white/10">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-2 py-1 transition-colors",
                                "hover:text-[#7A5AF8]",
                                isActive ? "text-[#7A5AF8]" : "text-white/60"
                            )}
                        >
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={24}
                                height={24}
                                className={cn(
                                    "transition-all",
                                    isActive && "[filter:brightness(0)_saturate(100%)_invert(37%)_sepia(52%)_saturate(2878%)_hue-rotate(234deg)_brightness(99%)_contrast(94%)]"
                                )}
                            />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
