"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function MagicLinkPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/magic-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                // In development, show the token for testing
                if (data.token) {
                    setDevToken(data.token);
                }
            } else {
                setError(data.message || "Failed to send magic link");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="border-0 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mx-auto mb-4 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Parent Login</CardTitle>
                        <CardDescription>
                            Enter your email to receive a login link
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="parent@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Magic Link"
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link
                                        href="/auth/login"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Staff Login
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-4"
                            >
                                <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto mb-4 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Check Your Email!</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    We've sent a login link to <strong>{email}</strong>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    The link will expire in 1 hour.
                                </p>

                                {/* Dev-only: Show token for testing */}
                                {devToken && (
                                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left">
                                        <p className="text-xs font-medium text-amber-600 mb-2">
                                            🛠️ Development Only
                                        </p>
                                        <button
                                            onClick={() => {
                                                window.location.href = `/auth/magic-link/verify?token=${devToken}`;
                                            }}
                                            className="text-sm text-primary underline break-all text-left"
                                        >
                                            Click here to login (dev link)
                                        </button>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setDevToken(null);
                                    }}
                                >
                                    Send to different email
                                </Button>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Parents can log in without a password using their registered email.
                </p>
            </motion.div>
        </div>
    );
}
