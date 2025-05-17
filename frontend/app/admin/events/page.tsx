'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventsAPI, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Calendar, ExternalLink } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  category: string;
  eventDate: string;
  venue: string;
  price: number;
  maxCapacity: number | null;
  currentBookingsCount: number;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await EventsAPI.getAllEvents(0, 10, 'eventDate,asc');
        if (response && response.success && response.data) {
          setEvents(response.data.content || []);
        } else {
          throw new Error('Failed to load events');
        }
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(`Failed to load events: ${errorMessage}`);
        toast({
          title: 'Error loading events',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await EventsAPI.deleteEvent(eventId);
        if (response && response.success) {
          // Remove the deleted event from state
          setEvents(events.filter(event => event.id !== eventId));
          toast({
            title: 'Event Deleted',
            description: 'The event has been successfully deleted.',
          });
        } else {
          throw new Error('Failed to delete event');
        }
      } catch (err) {
        const errorMessage = handleApiError(err);
        toast({
          title: 'Error deleting event',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Events Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events Management</CardTitle>
          <Button asChild>
            <Link href="/admin/events/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Event
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No events found. Create your first event to get started.</p>
              <Button asChild>
                <Link href="/admin/events/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.category.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell>${event.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {event.currentBookingsCount} / {event.maxCapacity || '∞'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/events/${event.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
