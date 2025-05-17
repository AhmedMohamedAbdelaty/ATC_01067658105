'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventsAPI, handleApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

interface Event {
    id: string;
    name: string;
    category: string;
    eventDate: string;
    venue: string;
    price: number;
    maxCapacity: number | null;
    currentBookingsCount: number;
    imageUrl: string | null;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);
    const [avgOccupancy, setAvgOccupancy] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

    const pageSize = 10;

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!isAdmin) {
            router.push('/');
            return;
        }

        loadEvents();
        loadStatistics();
    }, [user, isAdmin, currentPage]);

    const loadEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await EventsAPI.getAllEvents(currentPage, pageSize, 'eventDate,asc');

            if (response.success && response.data) {
                setEvents(response.data.content);
                setTotalPages(response.data.totalPages);
            } else {
                setError('Failed to load events');
            }
        } catch (err) {
            handleApiError(err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const response = await EventsAPI.getAllEvents(0, 1000);

            if (response.success && response.data) {
                const events = response.data.content;

                setTotalEvents(events.length);

                const bookingsCount = events.reduce((total, event) => total + (event.currentBookingsCount || 0), 0);
                setTotalBookings(bookingsCount);

                const eventsWithCapacity = events.filter(event => event.maxCapacity && event.maxCapacity > 0);

                if (eventsWithCapacity.length > 0) {
                    const occupancyPercentages = eventsWithCapacity.map(event => (event.currentBookingsCount / event.maxCapacity!) * 100);
                    const avgOccupancyValue = occupancyPercentages.reduce((sum, percent) => sum + percent, 0) / occupancyPercentages.length;
                    setAvgOccupancy(avgOccupancyValue);
                } else {
                    setAvgOccupancy(0);
                }

                const revenue = events.reduce((total, event) => total + event.price * (event.currentBookingsCount || 0), 0);
                setTotalRevenue(revenue);
            }
        } catch (err) {
            console.error('Error loading statistics:', err);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        setDeletingEventId(eventId);

        try {
            const response = await EventsAPI.deleteEvent(eventId);

            if (response.success) {
                // Remove the deleted event from the list
                setEvents(events.filter(event => event.id !== eventId));

                // If this was the last event on the page and not the first page, go to previous page
                if (events.length === 1 && currentPage > 0) {
                    setCurrentPage(currentPage - 1);
                } else {
                    // Otherwise just reload the current page
                    loadEvents();
                }

                // Reload statistics
                loadStatistics();
            } else {
                throw new Error(response.error || 'Failed to delete event');
            }
        } catch (err) {
            handleApiError(err);
        } finally {
            setDeletingEventId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
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

    const isEventInPast = (dateString: string) => {
        const eventDate = new Date(dateString);
        const now = new Date();
        return eventDate < now;
    };

    const getEventStatus = (event: Event) => {
        if (isEventInPast(event.eventDate)) {
            return {
                label: 'Past',
                color: 'secondary',
            };
        }

        if (event.maxCapacity && event.currentBookingsCount >= event.maxCapacity) {
            return {
                label: 'Sold Out',
                color: 'destructive',
            };
        }

        const now = new Date();
        const eventDate = new Date(event.eventDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        if (eventDate <= threeDaysFromNow) {
            return {
                label: 'Upcoming Soon',
                color: 'warning',
            };
        }

        return {
            label: 'Active',
            color: 'success',
        };
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <Pagination className="mt-4">
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

    return (
        <div className="container py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage events and view statistics</p>
                </div>
                <Button asChild className="mt-4 md:mt-0">
                    <Link href="/admin/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Event
                    </Link>
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEvents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Occupancy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Event Management</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-destructive mb-4">Error: {error}</div>
                            <Button onClick={loadEvents}>Try Again</Button>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8">
                            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
                            <p className="text-muted-foreground mb-4">You haven't created any events yet.</p>
                            <Button asChild>
                                <Link href="/admin/events/new">Create Your First Event</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Bookings</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map(event => {
                                        const status = getEventStatus(event);

                                        return (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-8 h-8 rounded bg-muted bg-cover bg-center"
                                                            style={{
                                                                backgroundImage: event.imageUrl
                                                                    ? `url(${
                                                                          event.imageUrl.startsWith('http')
                                                                              ? event.imageUrl
                                                                              : `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${event.imageUrl}`
                                                                      })`
                                                                    : 'none',
                                                            }}
                                                        ></div>
                                                        <div>
                                                            <div className="font-medium truncate max-w-[200px]">{event.name}</div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{event.venue}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{event.category}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{formatDate(event.eventDate)}</div>
                                                    <div className="text-xs text-muted-foreground">{formatTime(event.eventDate)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={status.color as any}>{status.label}</Badge>
                                                </TableCell>
                                                <TableCell>${event.price.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {event.currentBookingsCount}
                                                            {event.maxCapacity ? ` / ${event.maxCapacity}` : ''}
                                                        </span>
                                                        {event.maxCapacity && (
                                                            <div className="w-16 bg-muted rounded-full h-2">
                                                                <div
                                                                    className="bg-primary rounded-full h-2"
                                                                    style={{
                                                                        width: `${Math.min(100, (event.currentBookingsCount / event.maxCapacity) * 100)}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" asChild title="View Event">
                                                            <Link href={`/events/${event.id}`}>
                                                                <CalendarDays className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" asChild title="Edit Event">
                                                            <Link href={`/admin/events/${event.id}`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    title="Delete Event"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{event.name}"? This action cannot be undone and will remove all bookings
                                                                        associated with this event.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteEvent(event.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        disabled={deletingEventId === event.id}
                                                                    >
                                                                        {deletingEventId === event.id ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Deleting...
                                                                            </>
                                                                        ) : (
                                                                            'Delete Event'
                                                                        )}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {renderPagination()}
                </CardContent>
            </Card>
        </div>
    );
}
