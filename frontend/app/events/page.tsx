'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EventsAPI, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, MapPin, Search, Users, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
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
}

// Mock data for demonstration when API fails
const mockEvents: Event[] = [
    {
        id: '1',
        name: 'Tech Innovation Summit',
        description: 'Join industry leaders to explore the latest technological innovations and future trends.',
        category: 'CONFERENCE',
        eventDate: '2025-06-15T09:00:00',
        venue: 'Grand Convention Center',
        price: 149.99,
        imageUrl: '/images/tech-conference.png',
        maxCapacity: 500,
        currentBookingsCount: 320,
        isCurrentUserBooked: false,
    },
    {
        id: '2',
        name: 'Digital Marketing Masterclass',
        description: 'Learn cutting-edge digital marketing strategies from top marketing professionals.',
        category: 'WORKSHOP',
        eventDate: '2025-06-20T10:00:00',
        venue: 'Business Hub Downtown',
        price: 79.99,
        imageUrl: '/images/event-venue.png',
        maxCapacity: 50,
        currentBookingsCount: 42,
        isCurrentUserBooked: false,
    },
    {
        id: '3',
        name: 'Summer Music Festival',
        description: 'A three-day music extravaganza featuring top artists from around the world.',
        category: 'CONCERT',
        eventDate: '2025-07-05T16:00:00',
        venue: 'Riverside Park Amphitheater',
        price: 89.99,
        imageUrl: '/images/concert-event.png',
        maxCapacity: 2000,
        currentBookingsCount: 1500,
        isCurrentUserBooked: false,
    },
    {
        id: '4',
        name: 'Startup Networking Event',
        description: 'Connect with entrepreneurs, investors, and industry experts in this exclusive networking event.',
        category: 'NETWORKING',
        eventDate: '2025-06-25T18:00:00',
        venue: 'Innovation Hub',
        price: 25.0,
        imageUrl: null,
        maxCapacity: 100,
        currentBookingsCount: 65,
        isCurrentUserBooked: false,
    },
    {
        id: '5',
        name: 'Art Exhibition Opening',
        description: 'Be among the first to experience this stunning collection of contemporary art.',
        category: 'ARTS_AND_CULTURE',
        eventDate: '2025-07-10T19:00:00',
        venue: 'Metropolitan Gallery',
        price: 15.0,
        imageUrl: null,
        maxCapacity: 200,
        currentBookingsCount: 120,
        isCurrentUserBooked: false,
    },
    {
        id: '6',
        name: 'Culinary Masterclass',
        description: 'Learn to cook exquisite dishes with a renowned chef in this hands-on workshop.',
        category: 'FOOD_AND_DRINK',
        eventDate: '2025-07-15T11:00:00',
        venue: 'Gourmet Kitchen Studio',
        price: 120.0,
        imageUrl: null,
        maxCapacity: 30,
        currentBookingsCount: 25,
        isCurrentUserBooked: false,
    },
];

export default function EventsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const categoryUrlParam = searchParams.get('category');
    const searchUrlParam = searchParams.get('search');

    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSearchTerm, setTempSearchTerm] = useState('');

    const [priceRange, setPriceRange] = useState([0, 25000]);
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
    const [useMockData, setUseMockData] = useState(false);

    const pageSize = 9;
    const previousCategoryLoadedRef = useRef<string | null | undefined>();
    const [isInitialLoadTriggered, setIsInitialLoadTriggered] = useState(false);

    // When component mounts, mark loading as false to trigger initial events load
    useEffect(() => {
        // Initialize loading state to false after initial mount
        // This will trigger the second useEffect to load events
        setLoading(false);
    }, []);

    useEffect(() => {
        const initialCategory = categoryUrlParam ? (categoryUrlParam.endsWith('S') ? categoryUrlParam.slice(0, -1) : categoryUrlParam) : 'ALL';
        if (initialCategory !== activeCategory) {
            setActiveCategory(initialCategory);
        }

        const initialSearch = searchUrlParam || '';
        if (initialSearch !== searchTerm) {
            setSearchTerm(initialSearch);
        }
        if (initialSearch !== tempSearchTerm) {
            setTempSearchTerm(initialSearch);
        }
    }, [categoryUrlParam, searchUrlParam, activeCategory, searchTerm, tempSearchTerm]);

    useEffect(() => {
        const categoryForApi = activeCategory === 'ALL' ? null : activeCategory;

        if (!loading && (!isInitialLoadTriggered || previousCategoryLoadedRef.current !== categoryForApi)) {
            console.log('Effect 2: Triggering loadEvents. Initial:', !isInitialLoadTriggered, 'PrevCat:', previousCategoryLoadedRef.current, 'NewCat:', categoryForApi);
            loadEvents(0, categoryForApi);
            previousCategoryLoadedRef.current = categoryForApi;
            if (!isInitialLoadTriggered) {
                setIsInitialLoadTriggered(true);
            }
        } else {
            console.log('Skipping loadEvents. Loading:', loading, 'IsInitial:', isInitialLoadTriggered, 'PrevCat:', previousCategoryLoadedRef.current, 'ActiveCat:', activeCategory);
        }
    }, [activeCategory, loading, isInitialLoadTriggered]);

    useEffect(() => {
        applyFiltersToEvents();
    }, [events, searchTerm, activeCategory, priceRange, dateFilter, selectedVenues]);

    const loadEvents = async (pageToLoad: number, categoryToLoad: string | null) => {
        console.log(`loadEvents called - Category: ${categoryToLoad}, Page: ${pageToLoad}. Current loading state: ${loading}`);

        setLoading(true);
        setError(null);
        try {
            const apiCategoryParam = categoryToLoad === null ? undefined : categoryToLoad;
            console.log(`Calling EventsAPI.getAllEvents with effective category: ${apiCategoryParam}`);
            const response = await EventsAPI.getAllEvents(0, 1000, 'eventDate,asc', apiCategoryParam);
            console.log("API response:", response);

            if (response && response.success && response.data && Array.isArray(response.data.content)) {
                console.log(`Successfully loaded ${response.data.content.length} events`);
                setEvents(response.data.content);
                setUseMockData(false);
            } else {
                console.error('Invalid response format from API:', response);
                setError('Failed to load events: Invalid response format');
                setEvents(mockEvents);
                setUseMockData(true);
                toast({
                    title: 'API Error',
                    description: 'Could not fetch events from the server. Displaying demo data.',
                    variant: 'default',
                });
            }
        } catch (err) {
            const errorMessage = handleApiError(err);
            console.error('Error loading events:', err);
            setError(`Failed to load events: ${errorMessage}`);
            setEvents(mockEvents);
            setUseMockData(true);
            toast({
                title: 'API Error',
                description: `Could not connect to the API: ${errorMessage}. Displaying demo data.`,
                variant: 'destructive',
            });
        } finally {
            console.log("Finished loading events, setting loading to false");
            setLoading(false);
        }
    };

    const applyFiltersToEvents = () => {
        let tempFilteredEvents = [...events];

        if (activeCategory !== 'ALL') {
            tempFilteredEvents = tempFilteredEvents.filter(event => event.category.toUpperCase() === activeCategory.toUpperCase());
        }

        if (searchTerm) {
            tempFilteredEvents = tempFilteredEvents.filter(event =>
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        tempFilteredEvents = tempFilteredEvents.filter(event => event.price >= priceRange[0] && event.price <= priceRange[1]);

        if (dateFilter !== 'all') {
            const now = new Date();
            tempFilteredEvents = tempFilteredEvents.filter(event => {
                const eventDate = new Date(event.eventDate);
                if (dateFilter === 'today') return eventDate.toDateString() === now.toDateString();
                if (dateFilter === 'tomorrow') {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(now.getDate() + 1);
                    return eventDate.toDateString() === tomorrow.toDateString();
                }
                if (dateFilter === 'this_week') {
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                    return eventDate >= startOfWeek && eventDate <= endOfWeek;
                }
                if (dateFilter === 'this_month') {
                    return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
                }
                return true;
            });
        }

        if (selectedVenues.length > 0) {
            tempFilteredEvents = tempFilteredEvents.filter(event => selectedVenues.includes(event.venue));
        }

        setFilteredEvents(tempFilteredEvents);
        setTotalPages(Math.ceil(tempFilteredEvents.length / pageSize));
        if(currentPage * pageSize >= tempFilteredEvents.length && tempFilteredEvents.length > 0) {
            setCurrentPage(Math.max(0, Math.ceil(tempFilteredEvents.length / pageSize) - 1));
        } else if (tempFilteredEvents.length === 0) {
            setCurrentPage(0);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const handleSearch = () => {
        setSearchTerm(tempSearchTerm);
        setCurrentPage(0);

        const params = new URLSearchParams(searchParams.toString());
        if (tempSearchTerm) {
            params.set('search', tempSearchTerm);
        } else {
            params.delete('search');
        }

        router.push(`/events?${params.toString()}`);
    };

    const handleCategoryChange = (value: string) => {
        setActiveCategory(value);
        setCurrentPage(0);

        const params = new URLSearchParams(searchParams.toString());
        if (value !== 'ALL') {
            params.set('category', value);
        } else {
            params.delete('category');
        }

        router.push(`/events?${params.toString()}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const applyFilters = () => {
        setCurrentPage(0);
    };

    const clearFilters = () => {
        setPriceRange([0, 25000]);
        setDateFilter('all');
        setSelectedVenues([]);
        setCurrentPage(0);
    };

    const getEventImageUrl = (imageUrl: string | null) => {
        if (!imageUrl) return '/images/event-placeholder.png';

        if (imageUrl.startsWith('http') || imageUrl.startsWith('/images/')) {
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

    const getPaginatedEvents = () => {
        const startIndex = currentPage * pageSize;
        return filteredEvents.slice(startIndex, startIndex + pageSize);
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

    const renderEventCards = () => {
        if (loading) {
            return Array.from({ length: 6 }).map((_, index) => (
                <motion.div key={index} className="col-span-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <Card className="h-full overflow-hidden">
                        <Skeleton className="h-48 w-full skeleton-pulse" />
                        <CardHeader className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-2 skeleton-pulse" />
                            <Skeleton className="h-4 w-1/2 skeleton-pulse" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Skeleton className="h-4 w-full mb-2 skeleton-pulse" />
                            <Skeleton className="h-4 w-full mb-2 skeleton-pulse" />
                            <Skeleton className="h-4 w-2/3 skeleton-pulse" />
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-10 w-full skeleton-pulse" />
                        </CardFooter>
                    </Card>
                </motion.div>
            ));
        }

        if (error && !useMockData) {
            return (
                <motion.div className="col-span-full text-center py-12" initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="text-destructive mb-4">Error: {error}</div>
                    <Button onClick={() => loadEvents(0, null)}>Try Again</Button>
                </motion.div>
            );
        }

        const displayEvents = getPaginatedEvents();

        if (displayEvents.length === 0) {
            return (
                <motion.div className="col-span-full text-center py-12" initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="text-4xl mb-4">😢</div>
                    <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                    <p className="text-muted-foreground mb-4">
                        {activeCategory !== 'ALL' ? `There are no events in the ${activeCategory} category matching your criteria.` : 'There are no events matching your criteria.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {activeCategory !== 'ALL' && <Button onClick={() => handleCategoryChange('ALL')}>View All Events</Button>}
                        {dateFilter !== 'all' && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                        {searchTerm && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setTempSearchTerm('');
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete('search');
                                    router.push(`/events?${params.toString()}`);
                                }}
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" animate="visible" variants={staggerContainer}>
                {displayEvents.map(event => {
                    const isSoldOut = event.maxCapacity !== null && event.currentBookingsCount >= event.maxCapacity;
                    const canBookOrViewDetails = !isSoldOut || event.isCurrentUserBooked;

                    return (
                        <motion.div key={event.id} variants={cardVariant} className="col-span-1">
                            <Card className={`event-card h-full flex flex-col overflow-hidden ${isSoldOut && !event.isCurrentUserBooked ? 'opacity-70' : ''}`}>
                                <div className="relative overflow-hidden">
                                    <img
                                        src={getEventImageUrl(event.imageUrl) || '/placeholder.svg'}
                                        alt={event.name}
                                        className="w-full h-48 object-cover event-card-image"
                                        onError={e => {
                                            (e.target as HTMLImageElement).src = '/images/event-placeholder.png';
                                        }}
                                    />
                                    {event.isCurrentUserBooked && (
                                        <Badge className="absolute top-2 right-2 z-10 bg-green-600 text-white hover:bg-green-700">Booked</Badge>
                                    )}
                                    {isSoldOut && !event.isCurrentUserBooked && (
                                        <Badge variant="destructive" className="absolute top-2 left-2 z-10">Sold Out</Badge>
                                    )}
                                     {isSoldOut && event.isCurrentUserBooked && (
                                        <Badge variant="outline" className="absolute top-2 left-2 z-10 bg-background/80">Sold Out (Booked by you)</Badge>
                                    )}
                                </div>
                                <CardHeader className="p-4 pb-0">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                                        <Badge variant="outline" className="category-badge truncate ml-2">
                                            {event.category}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description || 'No description available.'}</p>
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
                                        {event.maxCapacity !== null && (
                                            <div className={`flex items-center ${isSoldOut ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                <Users className="h-4 w-4 mr-2" />
                                                <span>
                                                    {event.currentBookingsCount} / {event.maxCapacity} spots
                                                    {isSoldOut && <span className="font-semibold"> (Full)</span>}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                    <div className="w-full flex items-center justify-between">
                                        <div className="font-semibold">${event.price.toFixed(2)}</div>
                                        <Button asChild disabled={!canBookOrViewDetails && !event.isCurrentUserBooked}>
                                            <Link href={`/events/${event.id}`}
                                                  aria-disabled={!canBookOrViewDetails && !event.isCurrentUserBooked}
                                                  className={`${(!canBookOrViewDetails && !event.isCurrentUserBooked) ? 'pointer-events-none' : ''}`}>
                                                {event.isCurrentUserBooked ? 'View Booking' : (isSoldOut ? 'Sold Out' : 'View Details')}
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className="container py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">Discover and book amazing events</p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Select value={activeCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                <SelectItem value="CONFERENCE">Conference</SelectItem>
                                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                                <SelectItem value="SEMINAR">Seminar</SelectItem>
                                <SelectItem value="CONCERT">Concert</SelectItem>
                                <SelectItem value="NETWORKING">Networking</SelectItem>
                                <SelectItem value="EXHIBITION">Exhibition</SelectItem>
                                <SelectItem value="FESTIVAL">Festival</SelectItem>
                                <SelectItem value="SPORTS">Sports</SelectItem>
                                <SelectItem value="ARTS_AND_CULTURE">Arts and Culture</SelectItem>
                                <SelectItem value="FOOD_AND_DRINK">Food and Drink</SelectItem>
                                <SelectItem value="CHARITY">Charity</SelectItem>
                                <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                                <SelectItem value="BUSINESS">Business</SelectItem>
                                <SelectItem value="EDUCATION">Education</SelectItem>
                                <SelectItem value="HEALTH_AND_WELLNESS">Health and Wellness</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 flex">
                        <Input
                            placeholder="Search events..."
                            value={tempSearchTerm}
                            onChange={e => setTempSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="rounded-r-none"
                        />
                        <Button type="submit" onClick={handleSearch} className="rounded-l-none">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Filter Events</SheetTitle>
                                <SheetDescription>Refine your search with these filters</SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-6">
                                <Accordion type="single" collapsible defaultValue="price">
                                    <AccordionItem value="price">
                                        <AccordionTrigger>Price Range</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4">
                                                <Slider defaultValue={priceRange} max={25000} step={10} onValueChange={setPriceRange} />
                                                <div className="flex justify-between">
                                                    <span>${priceRange[0]}</span>
                                                    <span>${priceRange[1]}</span>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="date">
                                        <AccordionTrigger>Date</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="date-all" checked={dateFilter === 'all'} onCheckedChange={() => setDateFilter('all')} />
                                                    <label htmlFor="date-all">All dates</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="date-today" checked={dateFilter === 'today'} onCheckedChange={() => setDateFilter('today')} />
                                                    <label htmlFor="date-today">Today</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="date-tomorrow" checked={dateFilter === 'tomorrow'} onCheckedChange={() => setDateFilter('tomorrow')} />
                                                    <label htmlFor="date-tomorrow">Tomorrow</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="date-week" checked={dateFilter === 'week'} onCheckedChange={() => setDateFilter('week')} />
                                                    <label htmlFor="date-week">This week</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="date-month" checked={dateFilter === 'month'} onCheckedChange={() => setDateFilter('month')} />
                                                    <label htmlFor="date-month">This month</label>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="venue">
                                        <AccordionTrigger>Venue</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="venue-1"
                                                        checked={selectedVenues.includes('Grand Convention Center')}
                                                        onCheckedChange={checked => {
                                                            if (checked) {
                                                                setSelectedVenues([...selectedVenues, 'Grand Convention Center']);
                                                            } else {
                                                                setSelectedVenues(selectedVenues.filter(v => v !== 'Grand Convention Center'));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="venue-1">Grand Convention Center</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="venue-2"
                                                        checked={selectedVenues.includes('Business Hub Downtown')}
                                                        onCheckedChange={checked => {
                                                            if (checked) {
                                                                setSelectedVenues([...selectedVenues, 'Business Hub Downtown']);
                                                            } else {
                                                                setSelectedVenues(selectedVenues.filter(v => v !== 'Business Hub Downtown'));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="venue-2">Business Hub Downtown</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="venue-3"
                                                        checked={selectedVenues.includes('Riverside Park Amphitheater')}
                                                        onCheckedChange={checked => {
                                                            if (checked) {
                                                                setSelectedVenues([...selectedVenues, 'Riverside Park Amphitheater']);
                                                            } else {
                                                                setSelectedVenues(selectedVenues.filter(v => v !== 'Riverside Park Amphitheater'));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="venue-3">Riverside Park Amphitheater</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="venue-4"
                                                        checked={selectedVenues.includes('Innovation Hub')}
                                                        onCheckedChange={checked => {
                                                            if (checked) {
                                                                setSelectedVenues([...selectedVenues, 'Innovation Hub']);
                                                            } else {
                                                                setSelectedVenues(selectedVenues.filter(v => v !== 'Innovation Hub'));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="venue-4">Innovation Hub</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="venue-5"
                                                        checked={selectedVenues.includes('Metropolitan Gallery')}
                                                        onCheckedChange={checked => {
                                                            if (checked) {
                                                                setSelectedVenues([...selectedVenues, 'Metropolitan Gallery']);
                                                            } else {
                                                                setSelectedVenues(selectedVenues.filter(v => v !== 'Metropolitan Gallery'));
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="venue-5">Metropolitan Gallery</label>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={clearFilters} className="gap-2">
                                        <X className="h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                    <SheetClose asChild>
                                        <Button onClick={applyFilters}>Apply Filters</Button>
                                    </SheetClose>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </motion.div>

            {renderEventCards()}

            {renderPagination()}
        </div>
    );
}
