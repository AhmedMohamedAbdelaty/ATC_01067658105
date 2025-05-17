"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, LogOut, User, Menu, X, Loader2 } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAdmin, isLoading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const navLinks = [
    { href: "/", label: "Home", showWhen: "always" },
    { href: "/events", label: "Events", showWhen: "always" },
    { href: "/my-bookings", label: "My Bookings", showWhen: "authenticated" },
    { href: "/admin", label: "Admin Panel", showWhen: "admin" },
  ]

  const filteredLinks = navLinks.filter((link) => {
    if (link.showWhen === "always") return true
    if (link.showWhen === "authenticated" && user) return true
    if (link.showWhen === "admin" && isAdmin) return true
    return false
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <CalendarDays className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">Event Booking System</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {isLoading ? (
              <div className="h-5 w-20 animate-pulse rounded-md bg-muted md:w-32" />
            ) : (
              filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === link.href ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />

          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="h-8 w-8 md:hidden" />
          ) : (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
        </div>
      </div>

      {isMenuOpen && !isLoading && (
        <div className="md:hidden border-t p-4">
          <nav className="flex flex-col space-y-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    Sign up
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
