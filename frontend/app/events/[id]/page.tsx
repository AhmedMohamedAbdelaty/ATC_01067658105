'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import EventsAPI from '@/api/events';
import BookingsAPI from '@/api/bookings';
import { handleApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, MapPin, DollarSign, Users, Loader2, ArrowLeft, Calendar, CheckCircle, Share2, Heart, MessageCircle, Info, Star, User, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface Event {
    id: string;
    name: string;
    description: string;
    category: string;
    eventDate: string;
    venue: string;
    price: number;
    imageUrl: string | null;
    maxCapacity: number | null;
    currentBookingsCount: number;
    isCurrentUserBooked: boolean;
    adminCreatorUsername: string;
    createdAt: string;
    updatedAt: string;
}

// Sample reviews for demonstration
const sampleReviews = [
    {
        id: 1,
        name: 'Sarah Johnson',
        avatar: '/placeholder.svg?height=40&width=40',
        rating: 5,
        date: '2025-04-15',
        comment: 'This was an amazing event! The speakers were knowledgeable and the venue was perfect. Would definitely attend again.',
    },
    {
        id: 2,
        name: 'Michael Chen',
        avatar: '/placeholder.svg?height=40&width=40',
        rating: 4,
        date: '2025-04-12',
        comment: 'Great content and networking opportunities. The only downside was limited parking options.',
    },
    {
        id: 3,
        name: 'Emily Rodriguez',
        avatar: '/placeholder.svg?height=40&width=40',
        rating: 5,
        date: '2025-04-10',
        comment: 'Exceeded my expectations! The organizers did a fantastic job with everything from registration to catering.',
    },
];

// Sample similar events
const similarEvents = [
    {
        id: 'sim1',
        name: 'Digital Marketing Summit',
        category: 'CONFERENCE',
        date: '2025-07-15',
        venue: 'Tech Hub Center',
        image: '/placeholder.svg?height=100&width=200',
    },
    {
        id: 'sim2',
        name: 'Web Development Workshop',
        category: 'WORKSHOP',
        date: '2025-07-22',
        venue: 'Innovation Campus',
        image: '/placeholder.svg?height=100&width=200',
    },
    {
        id: 'sim3',
        name: 'AI in Business Conference',
        category: 'CONFERENCE',
        date: '2025-08-05',
        venue: 'Grand Convention Center',
        image: '/placeholder.svg?height=100&width=200',
    },
];

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        loadEventDetails();
    }, []);

    const loadEventDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await EventsAPI.getEventById(params.id as string);

            if (response.success && response.data) {
                setEvent(response.data);
            } else {
                setError('Failed to load event details');
            }
        } catch (err) {
            handleApiError(err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleBookEvent = async () => {
        if (!user) {
            // Save current URL to redirect back after login
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            toast({
                title: "Authentication Required",
                description: "Please log in to book this event",
                variant: "default"
            });
            router.push('/login');
            return;
        }

        setBookingInProgress(true);

        try {
            toast({
                title: "Processing Booking",
                description: "Please wait while we process your booking...",
                variant: "default"
            });

            const response = await BookingsAPI.createBooking(params.id as string);

            if (response.success) {
                toast({
                    title: 'Booking Successful!',
                    description: 'You have successfully booked this event.',
                    variant: 'default',
                });

                // Refresh event details to show updated booking status
                await loadEventDetails();

                // Redirect to congratulations page
                const eventName = encodeURIComponent(event?.name || '');
                const eventDate = encodeURIComponent(event?.eventDate || '');
                const eventVenue = encodeURIComponent(event?.venue || '');
                const bookingId = response.data?.id ? encodeURIComponent(response.data.id) : '';

                router.push(`/congratulations?eventName=${eventName}&eventDate=${eventDate}&eventVenue=${eventVenue}&bookingId=${bookingId}`);
            } else {
                throw new Error(response.error || 'Booking failed');
            }
        } catch (err) {
            const errorMessage = handleApiError(err);
            toast({
                title: 'Booking Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setBookingInProgress(false);
        }
    };

    const handleShareEvent = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: event?.name || 'Event Details',
                    text: `Check out this event: ${event?.name}`,
                    url: window.location.href,
                })
                .catch(error => console.log('Error sharing', error));
        } else {
            // Fallback for browsers that don't support the Web Share API
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: 'Link copied!',
                description: 'Event link copied to clipboard',
            });
        }
    };

    const getEventImageUrl = (imageUrl: string | null) => {
        if (!imageUrl) return '/images/event-placeholder.png';

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        return `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${imageUrl}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isEventInPast = (dateString: string) => {
        const eventDate = new Date(dateString);
        const now = new Date();
        return eventDate < now;
    };

    const isSoldOut = (event: Event) => {
        return event.maxCapacity !== null && event.currentBookingsCount >= event.maxCapacity;
    };

    const getAverageRating = () => {
        const sum = sampleReviews.reduce((total, review) => total + review.rating, 0);
        return (sum / sampleReviews.length).toFixed(1);
    };

    if (loading) {
        return (
            <div className="container py-8 md:py-12">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="sm" className="mr-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="aspect-video rounded-lg" />
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/3" />
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-2/3" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="container py-8 md:py-12">
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">😢</div>
                    <h3 className="text-xl font-semibold mb-2">Event Not Found</h3>
                    <p className="text-muted-foreground mb-6">{error || "The event you're looking for doesn't exist or has been removed."}</p>
                    <Button asChild>
                        <Link href="/events">Browse Events</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isPastEvent = isEventInPast(event.eventDate);
    const eventSoldOut = isSoldOut(event);

    return (
        <div className="container py-8 md:py-12">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex items-center mb-6">
                <Button variant="ghost" size="sm" asChild className="mr-4">
                    <Link href="/events">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Events
                    </Link>
                </Button>
                <Badge variant="outline" className="category-badge">
                    {event.category}
                </Badge>
                <div className="ml-auto flex gap-2">
                    {event.isCurrentUserBooked && (
                        <Badge className="mr-2 bg-green-600 text-white">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Booked
                        </Badge>
                    )}
                    {isAdmin && (
                        <Button variant="outline" size="sm" asChild className="mr-2">
                            <Link href={`/admin/events/${event.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Event
                            </Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)} className={isLiked ? 'text-red-500' : ''}>
                        <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                        Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShareEvent}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>
            </motion.div>

            {/* Event Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Event Image */}
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="rounded-lg overflow-hidden">
                    <img
                        src={getEventImageUrl(event.imageUrl)}
                        alt={event.name}
                        className="w-full object-cover aspect-video rounded-lg"
                        onError={e => {
                            (e.target as HTMLImageElement).src = '/images/event-placeholder.png';
                        }}
                    />
                </motion.div>

                {/* Event Details */}
                <motion.div initial="hidden" animate="visible" variants={slideUp} className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{event.name}</h1>
                        <div className="flex items-center space-x-2 mb-4">
                            <Badge variant="outline" className="category-badge">
                                {event.category}
                            </Badge>
                            {event.isCurrentUserBooked && (
                                <Badge className="bg-green-600 text-white">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Booked
                                </Badge>
                            )}
                            {isPastEvent && <Badge variant="secondary">Past Event</Badge>}
                            {eventSoldOut && !event.isCurrentUserBooked && <Badge variant="destructive">Sold Out</Badge>}
                        </div>
                        <p className="text-muted-foreground">{event.description}</p>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <span className="font-medium">Date</span>
                                <p>{formatDate(event.eventDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <span className="font-medium">Time</span>
                                <p>{formatTime(event.eventDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <span className="font-medium">Venue</span>
                                <p>{event.venue}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <span className="font-medium">Price</span>
                                <p>${event.price.toFixed(2)}</p>
                            </div>
                        </div>
                        {event.maxCapacity !== null && (
                            <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                                <div>
                                    <span className="font-medium">Capacity</span>
                                    <p>
                                        {event.currentBookingsCount} / {event.maxCapacity} spots
                                        {eventSoldOut && <span className="text-destructive font-medium"> (Sold Out)</span>}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        {event.isCurrentUserBooked ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg">
                                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                    <span>You've booked this event. Check your <Link href="/my-bookings" className="underline font-medium">My Bookings</Link> page for details.</span>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href="/my-bookings">View My Bookings</Link>
                                </Button>
                            </div>
                        ) : isPastEvent ? (
                            <Button disabled className="w-full">Event has ended</Button>
                        ) : eventSoldOut ? (
                            <Button disabled className="w-full">Sold Out</Button>
                        ) : (
                            <Button
                                onClick={handleBookEvent}
                                disabled={bookingInProgress}
                                className="w-full"
                            >
                                {bookingInProgress ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Book Now - ${event.price.toFixed(2)}</>
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground pt-2">
                        <p>Created by {event.adminCreatorUsername} on {new Date(event.createdAt).toLocaleDateString()}</p>
                    </div>
                </motion.div>
            </div>

            {/* Tabs Section */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-12">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="similar">Similar Events</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-2">
                                <h3 className="text-xl font-semibold mb-4">About This Event</h3>
                                <div className="prose max-w-none">
                                    <p>{event.description}</p>
                                    <p>
                                        Join us for this amazing event at {event.venue}. Whether you're a beginner or expert, this event offers
                                        something for everyone.
                                    </p>
                                    <h4>What You'll Experience</h4>
                                    <ul>
                                        <li>Engaging presentations from industry experts</li>
                                        <li>Hands-on workshops and interactive sessions</li>
                                        <li>Networking opportunities with like-minded professionals</li>
                                        <li>Exclusive content and resources to take home</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-span-1 space-y-6">
                                <div className="bg-muted rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-4">Event Information</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Date</p>
                                                <p className="text-sm text-muted-foreground">{formatDate(event.eventDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Time</p>
                                                <p className="text-sm text-muted-foreground">{formatTime(event.eventDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Location</p>
                                                <p className="text-sm text-muted-foreground">{event.venue}</p>
                                            </div>
                                        </div>
                                        {event.maxCapacity !== null && (
                                            <div className="flex items-center">
                                                <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">Capacity</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {event.currentBookingsCount} / {event.maxCapacity} spots
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-muted rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-4">Organizer</h3>
                                    <div className="flex items-center">
                                        <Avatar className="h-10 w-10 mr-4">
                                            <AvatarFallback>{event.adminCreatorUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{event.adminCreatorUsername}</p>
                                            <p className="text-sm text-muted-foreground">Event Organizer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews" className="pt-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-2">Reviews</h3>
                            <div className="flex items-center">
                                <div className="flex items-center mr-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < Number(getAverageRating()) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="font-semibold">{getAverageRating()}</span>
                                <span className="text-muted-foreground ml-2">({sampleReviews.length} reviews)</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sampleReviews.map(review => (
                                <div key={review.id} className="border-b pb-6">
                                    <div className="flex items-center mb-2">
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarImage src={review.avatar} alt={review.name} />
                                            <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{review.name}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="similar" className="pt-6">
                        <h3 className="text-xl font-semibold mb-6">Similar Events You Might Like</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {similarEvents.map(event => (
                                <Card key={event.id} className="h-full overflow-hidden">
                                    <img src={event.image} alt={event.name} className="w-full h-40 object-cover" />
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold mb-2">{event.name}</h4>
                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex items-center">
                                                <Badge variant="outline" className="category-badge">
                                                    {event.category}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center">
                                                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>{new Date(event.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="truncate">{event.venue}</span>
                                            </div>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="w-full">
                                            <Link href={`/events/${event.id}`}>View Details</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
