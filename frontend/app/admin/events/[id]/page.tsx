'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EventForm from '@/components/admin/event-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventsAPI, handleApiError } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
    CalendarDays, Clock, MapPin, Users, ArrowLeft,
    Eye, Edit2, Trash2, AlertTriangle, Loader2,
    DollarSign, ChevronsUpDown, FileEdit, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

export default function EventEditPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const eventId = params.id as string;
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('edit');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await EventsAPI.getEventById(eventId);
                if (response.success && response.data) {
                    setEvent(response.data);
                } else {
                    setError('Failed to fetch event details');
                }
            } catch (err) {
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

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

    const getEventImageUrl = (imageUrl: string | null) => {
        if (!imageUrl) return '/images/event-placeholder.png';

        if (imageUrl.startsWith('http') || imageUrl.startsWith('/images/')) {
            return imageUrl;
        }

        return `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${imageUrl}`;
    };

    const handleDeleteEvent = async () => {
        try {
            setIsDeleting(true);
            const response = await EventsAPI.deleteEvent(eventId);
            if (response.success) {
                toast({
                    title: "Event Deleted",
                    description: "The event has been successfully deleted",
                    variant: "default"
                });
                router.push('/admin/events');
                router.refresh();
            } else {
                throw new Error(response.error || 'Failed to delete event');
            }
        } catch (err) {
            const errorMessage = handleApiError(err);
            toast({
                title: 'Error Deleting Event',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getCapacityPercentage = () => {
        if (!event?.maxCapacity) return 0;
        return Math.min(Math.round((event.currentBookingsCount / event.maxCapacity) * 100), 100);
    };

    const getCapacityColor = () => {
        const percentage = getCapacityPercentage();
        if (percentage >= 90) return "bg-destructive";
        if (percentage >= 70) return "bg-warning";
        return "bg-primary";
    };

    if (loading) {
        return (
            <div className="container py-8 md:py-12 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Loading event data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch the event details</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8 md:py-12">
                <div className="bg-destructive/10 border border-destructive rounded-lg p-6 flex flex-col items-center max-w-xl mx-auto">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <h1 className="text-xl font-semibold mb-2">Error Loading Event</h1>
                    <p className="text-center mb-4">{error}</p>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 md:py-12">
            {/* Header */}
            <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div>
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin">Admin</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin/events">Event Management</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Edit Event</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{event?.name}</h1>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={event?.maxCapacity <= event?.currentBookingsCount ? "destructive" : "secondary"}
                                    className="text-xs"
                                >
                                    {event?.currentBookingsCount}/{event?.maxCapacity} spots filled
                                </Badge>
                                <Badge variant="outline" className="text-xs">{event?.category.replace(/_/g, ' ')}</Badge>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-2">
                            {formatDate(event?.eventDate)} at {formatTime(event?.eventDate)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-2"
                        >
                            <Link href={`/events/${eventId}`}>
                                <Eye className="h-4 w-4" />
                                View Live
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the event
                                        and remove all associated data including bookings.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteEvent}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>Delete Event</>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Progress bar for capacity */}
                {event?.maxCapacity > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between mb-1 text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">{getCapacityPercentage()}%</span>
                        </div>
                        <Progress value={getCapacityPercentage()} className="h-2"
                            indicatorClassName={cn(getCapacityColor())}
                        />
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
                <EventForm eventId={eventId} />
            </div>
        </div>
    );
}
