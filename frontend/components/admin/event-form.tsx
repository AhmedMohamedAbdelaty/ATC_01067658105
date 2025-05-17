'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EventsAPI, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2, MapPin, XCircle, ImagePlus, Upload, Save, Trash2, AlertCircle, ChevronRight } from 'lucide-react';

const eventFormSchema = z.object({
    name: z.string().min(3, 'Event name must be at least 3 characters').max(100),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
    category: z.string().min(1, 'Category is required'),
    eventDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
        message: "Invalid date format. Please use YYYY-MM-DDTHH:MM",
    }),
    venue: z.string().min(3, 'Venue is required').max(100),
    price: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number().min(0, 'Price must be a positive number')
    ),
    maxCapacity: z.preprocess(
        (val) => (String(val).trim() === '' ? null : parseInt(String(val), 10)),
        z.number().int().positive('Max capacity must be a positive integer').nullable()
    ),
    isRecurring: z.boolean().default(false),
    recurringPattern: z.string().optional(),
    hasRegistrationDeadline: z.boolean().default(false),
    registrationDeadline: z.string().optional(),
    isOnlineEvent: z.boolean().default(false),
    onlineEventUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
    eventId?: string; // For edit mode
}

export default function EventForm({ eventId }: EventFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingEvent, setIsFetchingEvent] = useState(!!eventId);
    const [activeTab, setActiveTab] = useState('basic');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentTag, setCurrentTag] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, dirtyFields },
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            name: '',
            description: '',
            category: '',
            eventDate: '', // Format: YYYY-MM-DDTHH:MM
            venue: '',
            price: 0,
            maxCapacity: null,
            isRecurring: false,
            recurringPattern: 'weekly',
            hasRegistrationDeadline: false,
            registrationDeadline: '',
            isOnlineEvent: false,
            onlineEventUrl: '',
            isFeatured: false,
            tags: [],
        },
    });

    // Watch form values for conditional fields
    const isRecurring = watch('isRecurring');
    const hasRegistrationDeadline = watch('hasRegistrationDeadline');
    const isOnlineEvent = watch('isOnlineEvent');
    const tags = watch('tags');

    // Load existing event data when in edit mode
    useEffect(() => {
        if (eventId) {
            setIsFetchingEvent(true);
            EventsAPI.getEventById(eventId)
                .then(response => {
                    if (response.success && response.data) {
                        const event = response.data;
                        // Format date for datetime-local input
                        const formattedDate = event.eventDate ? new Date(event.eventDate).toISOString().substring(0, 16) : '';
                        reset({
                            name: event.name || '',
                            description: event.description || '',
                            category: event.category || '',
                            eventDate: formattedDate,
                            venue: event.venue || '',
                            price: event.price || 0,
                            maxCapacity: event.maxCapacity || null,
                            isRecurring: event.isRecurring || false,
                            recurringPattern: event.recurringPattern || 'weekly',
                            hasRegistrationDeadline: event.hasRegistrationDeadline || false,
                            registrationDeadline: event.registrationDeadline || '',
                            isOnlineEvent: event.isOnlineEvent || false,
                            onlineEventUrl: event.onlineEventUrl || '',
                            isFeatured: event.isFeatured || false,
                            tags: event.tags || [],
                        });
                        if (event.imageUrl) {
                            setImagePreview(
                                event.imageUrl.startsWith('http')
                                    ? event.imageUrl
                                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${event.imageUrl}`
                            );
                        }
                    }
                })
                .catch(err => {
                    const errorMessage = handleApiError(err);
                    toast({
                        title: 'Error fetching event details',
                        description: errorMessage,
                        variant: 'destructive'
                    });
                })
                .finally(() => setIsFetchingEvent(false));
        }
    }, [eventId, reset, toast]);

    // Handle image changes via file input or drag and drop
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            processSelectedImage(file);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            processSelectedImage(file);
        }
    }, []);

    const processSelectedImage = (file: File) => {
        if (!file.type.match('image.*')) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file (JPEG, PNG, etc.)",
                variant: "destructive"
            });
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // Tag management
    const addTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setValue('tags', [...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setValue('tags', tags.filter(tag => tag !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    // Form submission
    const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
        setIsLoading(true);
        try {
            let response;
            const payload = {
                ...data,
                // Append seconds and Z for UTC to meet OffsetDateTime format requirements
                eventDate: data.eventDate ? `${data.eventDate}:00Z` : null,
                registrationDeadline: data.hasRegistrationDeadline && data.registrationDeadline
                    ? `${data.registrationDeadline}:00Z`
                    : null,
            };

            if (eventId) {
                response = await EventsAPI.updateEvent(eventId, payload);
            } else {
                response = await EventsAPI.createEvent(payload);
            }

            if (response.success && response.data) {
                const newOrUpdatedEventId = response.data.id;

                // Handle image upload if a new image was selected
                if (imageFile && newOrUpdatedEventId) {
                    try {
                        await EventsAPI.uploadEventImage(newOrUpdatedEventId, imageFile);
                    } catch (imgErr: any) {
                        toast({
                            title: "Image Upload Issue",
                            description: `The event was ${eventId ? 'updated' : 'created'}, but the image upload failed: ${imgErr.message}`,
                            variant: "default"
                        });
                    }
                }

                toast({
                    title: `Event ${eventId ? 'Updated' : 'Created'} Successfully`,
                    description: `Event '${data.name}' has been ${eventId ? 'updated' : 'created'}.`,
                    variant: "default"
                });

                router.push('/admin');
                router.refresh();
            } else {
                throw new Error(response.error || 'Failed to save event');
            }
        } catch (err) {
            const errorMessage = handleApiError(err);
            toast({
                title: 'Error Saving Event',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isFetchingEvent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-card rounded-lg border shadow-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Loading event data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch the event details</p>
            </div>
        );
    }

    const categories = [
        "CONFERENCE", "WORKSHOP", "SEMINAR", "CONCERT", "NETWORKING",
        "EXHIBITION", "FESTIVAL", "SPORTS", "ARTS_AND_CULTURE",
        "FOOD_AND_DRINK", "CHARITY", "TECHNOLOGY", "BUSINESS",
        "EDUCATION", "HEALTH_AND_WELLNESS", "OTHER"
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-fit">
                        <TabsTrigger value="basic" className="flex items-center gap-2 px-4 py-2">
                            <div className="size-5 flex items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
                            Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-2">
                            <div className="size-5 flex items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2 px-4 py-2">
                            <div className="size-5 flex items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
                            Media
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="flex items-center gap-2 px-4 py-2">
                            <div className="size-5 flex items-center justify-center rounded-full bg-primary/10 text-primary">4</div>
                            Advanced
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex space-x-3">
                        <Button type="button" variant="outline" onClick={() => router.back()} className="gap-2">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isLoading} className="gap-2">
                            {(isSubmitting || isLoading) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {eventId ? 'Update Event' : 'Create Event'}
                        </Button>
                    </div>
                </div>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-muted/40">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Enter the core details about your event
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base font-medium">
                                    Event Name <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="name"
                                            placeholder="e.g., Annual Tech Conference 2025"
                                            className="text-lg"
                                            {...field}
                                        />
                                    )}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive flex items-center mt-1">
                                        <AlertCircle className="h-4 w-4 mr-1" /> {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-base font-medium">
                                    Description <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Textarea
                                            id="description"
                                            placeholder="Provide a detailed description of your event..."
                                            {...field}
                                            rows={8}
                                            className="min-h-[200px] resize-y"
                                        />
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive flex items-center mt-1">
                                        <AlertCircle className="h-4 w-4 mr-1" /> {errors.description.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-base font-medium">
                                        Category <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="category"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger id="category" className="h-12">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat} value={cat}>
                                                            {cat.replace(/_/g, ' ')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.category && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.category.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="eventDate" className="text-base font-medium">
                                        Date and Time <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="eventDate"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="flex">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full h-12 justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    const currentTime = field.value
                                                                        ? new Date(field.value).toTimeString().substring(0, 5)
                                                                        : "12:00";
                                                                    const dateString = date.toISOString().substring(0, 10);
                                                                    field.onChange(`${dateString}T${currentTime}`);
                                                                }
                                                            }}
                                                            className="rounded-md border"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <div className="relative ml-2">
                                                    <Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                                    <Input
                                                        type="time"
                                                        value={field.value ? new Date(field.value).toTimeString().substring(0, 5) : ""}
                                                        onChange={(e) => {
                                                            if (field.value) {
                                                                const datePart = field.value.substring(0, 10);
                                                                field.onChange(`${datePart}T${e.target.value}`);
                                                            } else {
                                                                const today = new Date().toISOString().substring(0, 10);
                                                                field.onChange(`${today}T${e.target.value}`);
                                                            }
                                                        }}
                                                        className="pl-10 w-full h-12"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    />
                                    {errors.eventDate && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.eventDate.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-muted/30 border-t px-6 py-4">
                            <div></div>
                            <Button type="button" onClick={() => setActiveTab('details')} className="gap-2">
                                Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-muted/40">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
                                Event Details
                            </CardTitle>
                            <CardDescription>
                                Provide specific information about your event
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="venue" className="flex items-center gap-2 text-base font-medium">
                                        <MapPin className="h-4 w-4" />
                                        Location <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="venue"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="venue"
                                                placeholder="e.g., Grand Convention Center"
                                                className="h-12"
                                                {...field}
                                                disabled={isOnlineEvent}
                                            />
                                        )}
                                    />
                                    {errors.venue && !isOnlineEvent && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.venue.message}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 self-end mb-2">
                                    <Controller
                                        name="isOnlineEvent"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-md">
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked);
                                                        if (checked) {
                                                            setValue('venue', 'Online Event');
                                                        } else {
                                                            setValue('venue', '');
                                                            setValue('onlineEventUrl', '');
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="isOnlineEvent" className="text-sm font-medium cursor-pointer">Online Event</Label>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {isOnlineEvent && (
                                <div className="space-y-2">
                                    <Label htmlFor="onlineEventUrl" className="text-base font-medium">
                                        Online Event URL <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="onlineEventUrl"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="onlineEventUrl"
                                                placeholder="e.g., https://zoom.us/j/123456789"
                                                className="h-12"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.onlineEventUrl && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.onlineEventUrl.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-base font-medium">
                                        Ticket Price ($)
                                    </Label>
                                    <Controller
                                        name="price"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="price"
                                                type="number"
                                                placeholder="e.g., 29.99 (0 for free events)"
                                                className="h-12"
                                                {...field}
                                                step="0.01"
                                            />
                                        )}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.price.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxCapacity" className="text-base font-medium">
                                        Maximum Capacity
                                    </Label>
                                    <Controller
                                        name="maxCapacity"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="maxCapacity"
                                                type="number"
                                                placeholder="Leave empty for unlimited capacity"
                                                className="h-12"
                                                {...field}
                                                value={field.value === null ? '' : String(field.value)}
                                                onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                            />
                                        )}
                                    />
                                    {errors.maxCapacity && (
                                        <p className="text-sm text-destructive flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" /> {errors.maxCapacity.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-4 rounded-md bg-muted/40 border space-x-2">
                                    <Controller
                                        name="hasRegistrationDeadline"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="hasRegistrationDeadline"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <div>
                                        <Label htmlFor="hasRegistrationDeadline" className="font-medium">Set registration deadline</Label>
                                        <p className="text-sm text-muted-foreground">Limit when attendees can register for this event</p>
                                    </div>
                                </div>

                                {hasRegistrationDeadline && (
                                    <div className="ml-6 space-y-2">
                                        <Label htmlFor="registrationDeadline" className="text-base font-medium">Registration Deadline</Label>
                                        <Controller
                                            name="registrationDeadline"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    id="registrationDeadline"
                                                    type="datetime-local"
                                                    className="h-12"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-muted/30 border-t px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab('basic')}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" /> Previous
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setActiveTab('media')}
                                className="gap-2"
                            >
                                Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-muted/40">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
                                Event Media
                            </CardTitle>
                            <CardDescription>
                                Upload images and media for your event
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer",
                                    isDragging ? "border-primary bg-accent" : "border-border",
                                    imagePreview ? "border-primary/50" : ""
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('imageUpload')?.click()}
                            >
                                <input
                                    id="imageUpload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                {!imagePreview ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                            <ImagePlus className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="text-lg font-medium mb-1">Upload Event Image</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Drag and drop your event image here or click to browse
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Supports: JPG, PNG, WEBP (Max 5MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Event Preview"
                                            className="max-h-80 mx-auto rounded-md"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2 rounded-full shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage();
                                            }}
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </Button>
                                        <div className="mt-4 text-sm text-muted-foreground">
                                            Click or drag to replace this image
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-muted/30 border-t px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab('details')}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" /> Previous
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setActiveTab('advanced')}
                                className="gap-2"
                            >
                                Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-muted/40">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="size-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">4</div>
                                Advanced Settings
                            </CardTitle>
                            <CardDescription>
                                Configure additional options for your event
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-4 rounded-md bg-muted/40 border space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Controller
                                        name="isRecurring"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="isRecurring"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <div>
                                        <Label htmlFor="isRecurring" className="font-medium">This is a recurring event</Label>
                                        <p className="text-sm text-muted-foreground">Set up a repeating schedule for this event</p>
                                    </div>
                                </div>

                                {isRecurring && (
                                    <div className="ml-6 space-y-2">
                                        <Label htmlFor="recurringPattern" className="text-base font-medium">Recurrence Pattern</Label>
                                        <Controller
                                            name="recurringPattern"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || 'weekly'}>
                                                    <SelectTrigger id="recurringPattern" className="h-12">
                                                        <SelectValue placeholder="Select recurrence pattern" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base font-medium">Event Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="px-3 py-1.5 text-sm">
                                            {tag}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 ml-1 hover:bg-transparent"
                                                onClick={() => removeTag(tag)}
                                            >
                                                <XCircle className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">No tags added yet</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Add a tag and press Enter"
                                        className="flex-1 h-12"
                                    />
                                    <Button
                                        type="button"
                                        onClick={addTag}
                                        variant="outline"
                                        disabled={!currentTag.trim()}
                                        className="h-12"
                                    >
                                        Add Tag
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tags help attendees find your event more easily
                                </p>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between p-4 rounded-md bg-muted/40 border">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFeatured" className="font-medium">Feature this Event</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Featured events appear in highlighted sections
                                    </p>
                                </div>
                                <Controller
                                    name="isFeatured"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            id="isFeatured"
                                        />
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between bg-muted/30 border-t px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab('media')}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" /> Previous
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isLoading}
                                className="gap-2"
                            >
                                {(isSubmitting || isLoading) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {eventId ? 'Update Event' : 'Create Event'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-between border-t pt-6 mt-8">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="gap-2"
                >
                    {(isSubmitting || isLoading) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {eventId ? 'Update Event' : 'Create Event'}
                </Button>
            </div>
        </form>
    );
}
