'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            await register(username, email, password);
            // Redirect is handled in the auth context
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <CalendarDays className="mx-auto h-10 w-10" />
                    <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                    <p className="text-sm text-muted-foreground">Enter your details to create your account</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                            <CardDescription>Create your account to start booking events</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
