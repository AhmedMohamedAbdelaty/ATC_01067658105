'use client';

import EventForm from '@/components/admin/event-form'; // Assuming EventForm will be created
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';

export default function NewEventPage() {
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
                        <BreadcrumbPage>Create New Event</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Event</h1>
            <p className="text-muted-foreground mb-8">
                Fill in the details below to add a new event to the system.
            </p>
            <EventForm /> {/* No eventId for new event */}
        </div>
    );
}
