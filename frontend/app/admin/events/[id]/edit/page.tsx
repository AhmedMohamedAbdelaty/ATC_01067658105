'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EventForm from '@/components/admin/event-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EventsAPI, handleApiError } from '@/lib/api';

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [event, setEvent] = useState<any>(null);

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
            <Breadcrumb className="mb-8">
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

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Event: {event?.name}</h1>
                <p className="text-muted-foreground">
                    Make changes to your event details below.
                </p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
                <EventForm eventId={eventId} />
            </div>
        </div>
    );
}
