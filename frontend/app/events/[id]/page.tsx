'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EventsAPI, BookingsAPI, handleApiError } from '@/lib/api';
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
import { CalendarDays, Clock, MapPin, DollarSign, Users, Loader2, ArrowLeft, Calendar, CheckCircle, Share2, Heart, MessageCircle, Info, Star, User } from 'lucide-react';

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
    const { user } = useAuth();
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
            router.push('/login');
            return;
        }

        setBookingInProgress(true);

        try {
            const response = await BookingsAPI.createBooking(params.id as string);

            if (response.success) {
                toast({
                    title: 'Booking Successful!',
                    description: 'You have successfully booked this event.',
                    variant: 'default',
                });

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
            handleApiError(err);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div initial="hidden" animate="visible" variants={slideUp} className="lg:col-span-2">
                    <div className="rounded-lg overflow-hidden border">
                        <img
                            src={getEventImageUrl(event.imageUrl) || '/placeholder.svg'}
                            alt={event.name}
                            className="w-full aspect-video object-cover"
                            onError={e => {
                                (e.target as HTMLImageElement).src = '/images/event-placeholder.png';
                            }}
                        />
                    </div>

                    <Tabs defaultValue="about" className="mt-8">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            <TabsTrigger value="location">Location</TabsTrigger>
                        </TabsList>
                        <TabsContent value="about" className="mt-4">
                            <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                            <div className="prose max-w-none dark:prose-invert">
                                {event.description.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-3">Organizer</h3>
                                <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback>{event.adminCreatorUsername.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{event.adminCreatorUsername}</p>
                                        <p className="text-sm text-muted-foreground">Event Organizer</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="reviews" className="mt-4">
                            <div className="flex items-center mb-6">
                                <div className="mr-4">
                                    <div className="text-3xl font-bold">{getAverageRating()}</div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${
                                                    star <= Math.round(Number.parseFloat(getAverageRating())) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{sampleReviews.length} reviews</div>
                                </div>
                                <div className="flex-1">
                                    {[5, 4, 3, 2, 1].map(rating => {
                                        const count = sampleReviews.filter(r => r.rating === rating).length;
                                        const percentage = (count / sampleReviews.length) * 100;
                                        return (
                                            <div key={rating} className="flex items-center text-sm mb-1">
                                                <span className="w-3">{rating}</span>
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 ml-1 mr-2" />
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div className="bg-yellow-500 rounded-full h-2" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <span className="ml-2 text-muted-foreground">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {sampleReviews.map(review => (
                                    <div key={review.id} className="border-b pb-6 last:border-0">
                                        <div className="flex items-center mb-2">
                                            <Avatar className="h-8 w-8 mr-2">
                                                <AvatarImage src={review.avatar || '/placeholder.svg'} alt={review.name} />
                                                <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{review.name}</p>
                                                <div className="flex items-center">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground ml-2">{new Date(review.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm">{review.comment}</p>
                                    </div>
                                ))}
                            </div>

                            <Button variant="outline" className="mt-4 w-full">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Write a Review
                            </Button>
                        </TabsContent>
                        <TabsContent value="location" className="mt-4">
                            <h2 className="text-xl font-semibold mb-4">Event Location</h2>
                            <div className="rounded-lg overflow-hidden border mb-4">
                                <img src="/placeholder.svg?height=300&width=600" alt="Map location" className="w-full h-[300px] object-cover" />
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-2">{event.venue}</h3>
                                <p className="text-sm text-muted-foreground mb-4">123 Event Street, City, Country</p>
                                <div className="flex flex-col space-y-2 text-sm">
                                    <div className="flex items-start">
                                        <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Getting There</p>
                                            <p className="text-muted-foreground">Public transportation: Take the Blue Line to Central Station, then walk 5 minutes east.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Parking</p>
                                            <p className="text-muted-foreground">Paid parking available at the venue. $10 for the duration of the event.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Similar Events</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {similarEvents.map(simEvent => (
                                <Link href={`/events/${simEvent.id}`} key={simEvent.id}>
                                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                        <img src={simEvent.image || '/placeholder.svg'} alt={simEvent.name} className="w-full h-32 object-cover" />
                                        <div className="p-3">
                                            <h3 className="font-medium text-sm line-clamp-1">{simEvent.name}</h3>
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <CalendarDays className="h-3 w-3 mr-1" />
                                                <span>
                                                    {new Date(simEvent.date).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={slideUp} className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{event.name}</h1>
                        <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-muted-foreground" />
                            <p className="text-muted-foreground">Organized by {event.adminCreatorUsername}</p>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg space-y-4 bg-muted/30">
                        <div className="flex items-center">
                            <CalendarDays className="h-5 w-5 mr-3 text-primary" />
                            <div>
                                <p className="font-medium">{formatDate(event.eventDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-3 text-primary" />
                            <div>
                                <p className="font-medium">{formatTime(event.eventDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-3 text-primary" />
                            <div>
                                <p className="font-medium">{event.venue}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-3 text-primary" />
                            <div>
                                <p className="font-medium">${event.price.toFixed(2)}</p>
                            </div>
                        </div>
                        {event.maxCapacity && (
                            <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-primary" />
                                <div>
                                    <p className="font-medium">
                                        {event.currentBookingsCount} / {event.maxCapacity} spots filled
                                    </p>
                                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                                        <div
                                            className="bg-primary rounded-full h-2"
                                            style={{
                                                width: `${Math.min(100, (event.currentBookingsCount / event.maxCapacity) * 100)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {event.isCurrentUserBooked ? (
                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">You have booked this event</p>
                                <p className="text-sm text-green-600 dark:text-green-400">Check your bookings for more details</p>
                            </div>
                        </div>
                    ) : isPastEvent ? (
                        <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
                            <p className="font-medium text-amber-800 dark:text-amber-300">This event has already taken place</p>
                        </div>
                    ) : eventSoldOut ? (
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                            <p className="font-medium text-red-800 dark:text-red-300">This event is sold out</p>
                        </div>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full" size="lg">
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Book Now
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to book this event? You will receive a confirmation once your booking is complete.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBookEvent} disabled={bookingInProgress}>
                                        {bookingInProgress ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm Booking'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    <div className="flex justify-center">
                        <Button variant="outline" asChild>
                            <Link href="/my-bookings">View My Bookings</Link>
                        </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-3">Event Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Category</span>
                                <span>{event.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Event ID</span>
                                <span className="font-mono text-xs">{event.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
