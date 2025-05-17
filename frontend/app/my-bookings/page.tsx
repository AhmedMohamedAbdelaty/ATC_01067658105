'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookingsAPI, handleApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
import { CalendarDays, Clock, MapPin, Loader2, X } from 'lucide-react';

interface Booking {
    id: string;
    eventDetails: {
        id: string;
        name: string;
        description: string;
        category: string;
        eventDate: string;
        venue: string;
        price: number;
        imageUrl: string | null;
    };
    userId: string;
    userUsername: string;
    bookingTime: string;
    createdAt: string;
}

export default function MyBookingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

    const pageSize = 6;

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        loadBookings();
    }, [user, currentPage]);

    const loadBookings = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await BookingsAPI.getUserBookings(currentPage, pageSize, 'bookingTime,desc');

            if (response.success && response.data) {
                setBookings(response.data.content);
                setTotalPages(response.data.totalPages);
            } else {
                setError('Failed to load bookings');
            }
        } catch (err) {
            handleApiError(err);
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        setCancellingBookingId(bookingId);

        try {
            const response = await BookingsAPI.cancelBooking(bookingId);

            if (response.success) {
                toast({
                    title: 'Booking Cancelled',
                    description: 'Your booking has been successfully cancelled.',
                    variant: 'default',
                });

                // Remove the cancelled booking from the list
                setBookings(bookings.filter(booking => booking.id !== bookingId));

                // If this was the last booking on the page and not the first page, go to previous page
                if (bookings.length === 1 && currentPage > 0) {
                    setCurrentPage(currentPage - 1);
                } else {
                    // Otherwise just reload the current page
                    loadBookings();
                }
            } else {
                throw new Error(response.error || 'Failed to cancel booking');
            }
        } catch (err) {
            handleApiError(err);
        } finally {
            setCancellingBookingId(null);
        }
    };

    const getEventImageUrl = (imageUrl: string | null) => {
        if (!imageUrl) return '/images/event-placeholder.jpg';

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        return `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${imageUrl}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
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

    const formatBookingDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isEventInPast = (dateString: string) => {
        const eventDate = new Date(dateString);
        const now = new Date();
        return eventDate < now;
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <Pagination className="mt-8">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                if (currentPage > 0) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNumber;

                        if (totalPages <= 5) {
                            pageNumber = i;
                        } else if (currentPage < 3) {
                            pageNumber = i;
                        } else if (currentPage > totalPages - 4) {
                            pageNumber = totalPages - 5 + i;
                        } else {
                            pageNumber = currentPage - 2 + i;
                        }

                        if (pageNumber === 0 || pageNumber === totalPages - 1 || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                            return (
                                <PaginationItem key={pageNumber}>
                                    <PaginationLink
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            setCurrentPage(pageNumber);
                                        }}
                                        isActive={pageNumber === currentPage}
                                    >
                                        {pageNumber + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                            return (
                                <PaginationItem key={pageNumber}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            );
                        }

                        return null;
                    })}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };

    const renderBookingCards = () => {
        if (loading) {
            return Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="col-span-1">
                    <Card className="h-full overflow-hidden">
                        <div className="relative">
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <CardHeader className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                </div>
            ));
        }

        if (error) {
            return (
                <div className="col-span-full text-center py-12">
                    <div className="text-destructive mb-4">Error: {error}</div>
                    <Button onClick={loadBookings}>Try Again</Button>
                </div>
            );
        }

        if (bookings.length === 0) {
            return (
                <div className="col-span-full text-center py-12">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground mb-4">You haven't booked any events yet. Start exploring events and secure your spot!</p>
                    <Button asChild>
                        <Link href="/events">Browse Events</Link>
                    </Button>
                </div>
            );
        }

        return bookings.map(booking => {
            const event = booking.eventDetails;
            const isPastEvent = isEventInPast(event.eventDate);

            return (
                <div key={booking.id} className="col-span-1 fade-in">
                    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md">
                        <div className="relative">
                            {isPastEvent && <Badge className="absolute top-2 right-2 z-10 bg-gray-500">Past Event</Badge>}
                            <img
                                src={getEventImageUrl(event.imageUrl) || '/placeholder.svg'}
                                alt={event.name}
                                className="w-full h-48 object-cover"
                                onError={e => {
                                    (e.target as HTMLImageElement).src = '/images/event-placeholder.jpg';
                                }}
                            />
                        </div>
                        <CardHeader className="p-4 pb-0">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                                <Badge variant="outline" className="category-badge">
                                    {event.category}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 flex-grow">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{formatDate(event.eventDate)}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{formatTime(event.eventDate)}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="truncate">{event.venue}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">Booked on {formatBookingDate(booking.bookingTime)}</div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 mt-auto">
                            <div className="w-full flex items-center justify-between gap-2">
                                <Button variant="outline" asChild className="flex-1">
                                    <Link href={`/events/${event.id}`}>View Event</Link>
                                </Button>

                                {!isPastEvent && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to cancel your booking for "{event.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    disabled={cancellingBookingId === booking.id}
                                                >
                                                    {cancellingBookingId === booking.id ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Cancelling...
                                                        </>
                                                    ) : (
                                                        'Cancel Booking'
                                                    )}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            );
        });
    };

    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                    <p className="text-muted-foreground">Manage your event bookings</p>
                </div>
                <Button asChild className="mt-4 md:mt-0">
                    <Link href="/events">Browse More Events</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderBookingCards()}</div>

            {renderPagination()}
        </div>
    );
}
