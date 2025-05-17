'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CalendarDays, Clock, MapPin, Ticket } from 'lucide-react';

export default function CongratulationsPage() {
    const searchParams = useSearchParams();
    const [eventName, setEventName] = useState<string>('');
    const [eventDate, setEventDate] = useState<string>('');
    const [eventVenue, setEventVenue] = useState<string>('');
    const [bookingId, setBookingId] = useState<string>('');

    useEffect(() => {
        const name = searchParams.get('eventName');
        const date = searchParams.get('eventDate');
        const venue = searchParams.get('eventVenue');
        const id = searchParams.get('bookingId');

        if (name) setEventName(decodeURIComponent(name));
        if (date) setEventDate(decodeURIComponent(date));
        if (venue) setEventVenue(decodeURIComponent(venue));
        if (id) setBookingId(decodeURIComponent(id));
    }, [searchParams]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="container flex items-center justify-center min-h-[80vh] py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                    <CardDescription>Your spot has been secured. Get ready for an amazing event!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-3 pb-2 border-b">Booking Details</h3>

                        {bookingId && (
                            <div className="flex py-2">
                                <Ticket className="h-5 w-5 mr-3 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Booking ID</p>
                                    <p className="font-medium">{bookingId}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex py-2">
                            <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Event</p>
                                <p className="font-medium">{eventName || 'N/A'}</p>
                            </div>
                        </div>

                        {eventDate && (
                            <>
                                <div className="flex py-2">
                                    <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium">{formatDate(eventDate)}</p>
                                    </div>
                                </div>

                                <div className="flex py-2">
                                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-medium">{formatTime(eventDate)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex py-2">
                            <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Venue</p>
                                <p className="font-medium">{eventVenue || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button asChild className="w-full">
                        <Link href="/my-bookings">View My Bookings</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/events">Browse More Events</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
