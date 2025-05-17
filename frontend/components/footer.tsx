import Link from "next/link"
import { CalendarDays } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              <span className="font-bold">Event Booking System</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your gateway to amazing events. Find, book, and enjoy events with ease.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="text-muted-foreground hover:text-foreground">
                    Events
                  </Link>
                </li>
                <li>
                  <Link href="/my-bookings" className="text-muted-foreground hover:text-foreground">
                    My Bookings
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/events?category=CONFERENCE" className="text-muted-foreground hover:text-foreground">
                    Conferences
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=WORKSHOP" className="text-muted-foreground hover:text-foreground">
                    Workshops
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=CONCERT" className="text-muted-foreground hover:text-foreground">
                    Concerts
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=NETWORKING" className="text-muted-foreground hover:text-foreground">
                    Networking
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Event Booking System. All rights reserved.</p>
          <p className="mt-1">By Ahmed Mohamed - Areeb Competition</p>
        </div>
      </div>
    </footer>
  )
}
