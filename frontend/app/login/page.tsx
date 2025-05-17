'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api';

export default function LoginPage() {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(emailOrUsername, password);

            // Check if there's a redirect URL stored from a previous session
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectUrl);
            } else {
                router.push('/');
            }

            toast({
                title: "Login Successful",
                description: "You have been logged in successfully.",
                variant: "default",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
            setError(errorMessage);
            toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <CalendarDays className="mx-auto h-10 w-10" />
                    <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to sign in to your account</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>Access your account to manage your event bookings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="emailOrUsername">Email or Username</Label>
                                <Input
                                    id="emailOrUsername"
                                    type="text"
                                    placeholder="Enter your email or username"
                                    value={emailOrUsername}
                                    onChange={e => setEmailOrUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                                    Sign up
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
