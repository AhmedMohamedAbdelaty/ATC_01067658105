'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, Award, Clock, MapPin, Star, Zap, Shield, Heart, CheckCircle, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const featureItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Sample event categories
const categories = [
    { name: 'Conferences', value: 'CONFERENCE', icon: <Users className="h-5 w-5" />, count: 24 },
    { name: 'Workshops', value: 'WORKSHOP', icon: <CalendarDays className="h-5 w-5" />, count: 18 },
    { name: 'Concerts', value: 'CONCERT', icon: <Award className="h-5 w-5" />, count: 32 },
    { name: 'Networking', value: 'NETWORKING', icon: <Users className="h-5 w-5" />, count: 15 },
];

// Sample testimonials
const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Event Organizer',
        image: '/placeholder.svg?height=100&width=100',
        content: 'This platform has transformed how I manage my events. The booking system is intuitive and the analytics help me understand my audience better.',
        rating: 5,
    },
    {
        name: 'Michael Chen',
        role: 'Regular Attendee',
        image: '/placeholder.svg?height=100&width=100',
        content: "I've discovered so many amazing events through this platform. The booking process is seamless and I love getting personalized recommendations.",
        rating: 5,
    },
    {
        name: 'Emily Rodriguez',
        role: 'Corporate Client',
        image: '/placeholder.svg?height=100&width=100',
        content: "We use this platform for all our corporate events. It's reliable, professional, and offers excellent customer support when needed.",
        rating: 4,
    },
];

// Sample upcoming events
interface UpcomingEvent {
    id: string;
    name: string;
    category: string;
    date: string;
    venue: string;
    image: string;
    price: number;
    isBooked?: boolean;
}

const upcomingEvents: UpcomingEvent[] = [
    {
        id: '1',
        name: 'Tech Innovation Summit',
        category: 'CONFERENCE',
        date: '2025-06-15T09:00:00',
        venue: 'Grand Convention Center',
        image: '/images/tech-conference.png',
        price: 149.99,
    },
    {
        id: '2',
        name: 'Digital Marketing Masterclass',
        category: 'WORKSHOP',
        date: '2025-06-20T10:00:00',
        venue: 'Business Hub Downtown',
        image: '/images/event-venue.png',
        price: 79.99,
    },
    {
        id: '3',
        name: 'Summer Music Festival',
        category: 'CONCERT',
        date: '2025-07-05T16:00:00',
        venue: 'Riverside Park Amphitheater',
        image: '/images/concert-event.png',
        price: 89.99,
    },
];

// Stats counter component
interface CounterAnimationProps {
    target: string;
    label: string;
    duration?: number;
    prefix?: string;
    suffix?: string;
}

const CounterAnimation = ({ target, label, duration = 2000, prefix = '', suffix = '' }: CounterAnimationProps) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = Number.parseInt(target);
        const increment = end / (duration / 50);

        if (start === end) return;

        const timer = setInterval(() => {
            start += increment;
            setCount(Math.floor(start));
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [target, duration]);

    return (
        <div className="text-center">
            <div className="text-4xl font-bold mb-2">
                {prefix}
                {count.toLocaleString()}
                {suffix}
            </div>
            <p className="text-muted-foreground">{label}</p>
        </div>
    );
};

export default function Home() {
    const { user } = useAuth();

    // Check booked status based on user data
    const [bookedEvents, setBookedEvents] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // If user is logged in, check which events are booked
        if (user) {
            const checkBookedEvents = async () => {
                try {
                    // In a real implementation, we would fetch this from an API
                    // For now, let's pretend event with ID '2' is booked
                    setBookedEvents({ '2': true });
                } catch (error) {
                    console.error("Error loading booked events:", error);
                }
            };

            checkBookedEvents();
        }
    }, [user]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section
                className="py-24 md:py-32 text-center text-white relative"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.7)), url("/images/hero-bg.png")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                }}
            >
                <div className="container px-4 md:px-6 relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col items-center space-y-6 text-center max-w-4xl mx-auto">
                        <Badge className="px-4 py-1.5 text-sm bg-primary text-primary-foreground mb-4">Discover Amazing Events</Badge>
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                            Find & Book Events That <span className="text-primary">Inspire</span> You
                        </h1>
                        <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                            Your ultimate platform to discover, book, and manage tickets for concerts, workshops, conferences, and more!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <Button asChild size="lg" className="rounded-full px-8">
                                <Link href="/events">Explore Events</Link>
                            </Button>
                            {!user && (
                                <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-transparent text-white border-white hover:bg-white hover:text-primary">
                                    <Link href="/register">Create Account</Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
                        <motion.div variants={featureItem}>
                            <CounterAnimation target="5000" label="Events Hosted" suffix="+" />
                        </motion.div>
                        <motion.div variants={featureItem}>
                            <CounterAnimation target="25000" label="Happy Attendees" suffix="+" />
                        </motion.div>
                        <motion.div variants={featureItem}>
                            <CounterAnimation target="98" label="Satisfaction Rate" suffix="%" />
                        </motion.div>
                        <motion.div variants={featureItem}>
                            <CounterAnimation target="150" label="Cities Covered" suffix="+" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Wave divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
                        <path
                            fill="currentColor"
                            fillOpacity="1"
                            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                            className="text-background"
                        ></path>
                    </svg>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-4 text-center mb-12"
                    >
                        <Badge className="px-4 py-1.5 text-sm">Browse By Category</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Find Your Perfect Event</h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">Explore events by category to find exactly what you're looking for</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {categories.map((category, index) => (
                            <motion.div key={index} variants={featureItem}>
                                <Link href={`/events?category=${category.value}`}>
                                    <Card className="event-card h-full hover:border-primary/50">
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <div className="feature-icon-wrapper mb-4">{category.icon}</div>
                                            <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                                            <p className="text-muted-foreground">{category.count} events</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Featured Events Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-4 text-center mb-12"
                    >
                        <Badge className="px-4 py-1.5 text-sm">Don't Miss Out</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Upcoming Featured Events</h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">Book your spot at these popular events before they sell out</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {upcomingEvents.map((event, index) => (
                            <motion.div key={index} variants={featureItem}>
                                <Card className="event-card h-full overflow-hidden">
                                    <div className="relative">
                                        <img src={event.image || '/placeholder.svg'} alt={event.name} className="w-full event-card-image" />
                                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">{event.category}</Badge>
                                        {bookedEvents[event.id] && (
                                            <Badge className="absolute top-4 left-4 z-10 bg-green-600 text-white">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Booked
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex items-center">
                                                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>
                                                    {new Date(event.date).toLocaleDateString(undefined, {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>
                                                    {new Date(event.date).toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="truncate">{event.venue}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-lg">${event.price.toFixed(2)}</div>
                                            <Button asChild size="sm">
                                                <Link href={`/events/${event.id}`}>
                                                    {bookedEvents[event.id] ? 'View Booking' : 'Book Now'} <ChevronRight className="ml-1 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="flex justify-center mt-12">
                        <Button asChild variant="outline" size="lg">
                            <Link href="/events">
                                View All Events <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-4 text-center mb-12"
                    >
                        <Badge className="px-4 py-1.5 text-sm">Simple Process</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">Book your favorite events in just a few simple steps</p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
                    >
                        {/* Connecting line (visible on md screens and up) */}
                        <div className="absolute top-24 left-0 right-0 h-0.5 bg-primary/20 hidden md:block"></div>

                        <motion.div variants={featureItem} className="relative">
                            <div className="feature-card flex flex-col items-center text-center p-6">
                                <div className="feature-icon-wrapper mb-6 z-10">
                                    <CalendarDays className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">1. Discover Events</h3>
                                <p className="text-muted-foreground">
                                    Browse a wide variety of events. Filter by category, date, or location to find exactly what you're looking for.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div variants={featureItem} className="relative">
                            <div className="feature-card flex flex-col items-center text-center p-6">
                                <div className="feature-icon-wrapper mb-6 z-10">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">2. Book Seamlessly</h3>
                                <p className="text-muted-foreground">Secure your spot in a few simple clicks. Our booking process is fast, easy, and secure.</p>
                            </div>
                        </motion.div>

                        <motion.div variants={featureItem} className="relative">
                            <div className="feature-card flex flex-col items-center text-center p-6">
                                <div className="feature-icon-wrapper mb-6 z-10">
                                    <Award className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">3. Enjoy the Experience</h3>
                                <p className="text-muted-foreground">
                                    Attend your chosen event and create lasting memories. Manage all your bookings from your personal dashboard.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-4 text-center mb-12"
                    >
                        <Badge className="px-4 py-1.5 text-sm">Why Choose Us</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features You'll Love</h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">We provide the best event booking experience</p>
                    </motion.div>

                    <Tabs defaultValue="attendees" className="w-full max-w-4xl mx-auto">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
                            <TabsTrigger value="attendees">For Attendees</TabsTrigger>
                            <TabsTrigger value="organizers">For Organizers</TabsTrigger>
                            <TabsTrigger value="corporate">For Corporate</TabsTrigger>
                            <TabsTrigger value="community">For Community</TabsTrigger>
                        </TabsList>
                        <TabsContent value="attendees">
                            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
                                                <p className="text-muted-foreground">
                                                    Find events that match your interests with our smart recommendation system and powerful search filters.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Shield className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Secure Booking</h3>
                                                <p className="text-muted-foreground">
                                                    Book with confidence using our secure payment system with fraud protection and instant confirmations.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Heart className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Personalized Experience</h3>
                                                <p className="text-muted-foreground">Get personalized event recommendations based on your preferences and past attendance.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CheckCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
                                                <p className="text-muted-foreground">Manage all your bookings in one place with calendar integration and event reminders.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="organizers">
                            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Audience Reach</h3>
                                                <p className="text-muted-foreground">
                                                    Reach thousands of potential attendees with our platform's wide user base and promotion tools.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CalendarDays className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Event Management</h3>
                                                <p className="text-muted-foreground">
                                                    Powerful tools to create, manage, and track your events with real-time analytics and reporting.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Quick Payouts</h3>
                                                <p className="text-muted-foreground">
                                                    Receive payments quickly and securely with our streamlined payout system and financial tracking.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CheckCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Attendee Insights</h3>
                                                <p className="text-muted-foreground">Gain valuable insights about your audience with detailed analytics and feedback collection.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="corporate">
                            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Team Management</h3>
                                                <p className="text-muted-foreground">Manage corporate event attendance with team dashboards and group booking capabilities.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Shield className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Compliance & Security</h3>
                                                <p className="text-muted-foreground">
                                                    Enterprise-grade security and compliance features for corporate requirements and data protection.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CalendarDays className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Custom Events</h3>
                                                <p className="text-muted-foreground">Create private, invitation-only events with custom branding and registration flows.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CheckCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Reporting</h3>
                                                <p className="text-muted-foreground">
                                                    Comprehensive reporting tools for tracking attendance, expenses, and ROI for corporate events.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="community">
                            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Heart className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Nonprofit Discounts</h3>
                                                <p className="text-muted-foreground">Special pricing and features for nonprofit organizations and community groups.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Community Building</h3>
                                                <p className="text-muted-foreground">Tools to build and engage your community with discussion forums and member management.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Fundraising Tools</h3>
                                                <p className="text-muted-foreground">Integrated fundraising capabilities for charity events and community initiatives.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="feature-icon-wrapper shrink-0">
                                                <CalendarDays className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">Volunteer Management</h3>
                                                <p className="text-muted-foreground">
                                                    Coordinate volunteers and staff for community events with scheduling and role assignment tools.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-4 text-center mb-12"
                    >
                        <Badge className="px-4 py-1.5 text-sm">Testimonials</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">Don't just take our word for it - hear from our satisfied users</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div key={index} variants={featureItem}>
                                <Card className="testimonial-card h-full">
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-1 mb-4">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <p className="mb-6 italic">"{testimonial.content}"</p>
                                        <div className="flex items-center">
                                            <Avatar className="h-10 w-10 mr-4">
                                                <AvatarImage src={testimonial.image || '/placeholder.svg'} alt={testimonial.name} />
                                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{testimonial.name}</p>
                                                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="flex flex-col items-center space-y-6 text-center max-w-3xl mx-auto"
                    >
                        <Badge className="px-4 py-1.5 text-sm bg-white text-primary mb-4">Get Started Today</Badge>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Find Your Next Event?</h2>
                        <p className="mx-auto max-w-[700px] md:text-xl">Join Event Booking System today and never miss out on amazing experiences.</p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
                                <Link href="/events">Browse Events</Link>
                            </Button>
                            {!user && (
                                <Button asChild size="lg" variant="outline" className="rounded-full px-8 bg-transparent text-white border-white hover:bg-white hover:text-primary">
                                    <Link href="/register">Sign Up Now</Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
