"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setError("No token provided");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/magic-link/verify?token=${token}`
                );

                const data = await response.json();

                if (response.ok) {
                    // Store the JWT token
                    localStorage.setItem("accessToken", data.accessToken);

                    // Store user info if needed
                    if (data.user) {
                        localStorage.setItem("user", JSON.stringify(data.user));
                    }

                    setStatus("success");

                    // Redirect to parent portal after a brief delay
                    setTimeout(() => {
                        router.push("/parent");
                    }, 2000);
                } else {
                    setStatus("error");
                    setError(data.message || "Invalid or expired link");
                }
            } catch (err) {
                setStatus("error");
                setError("Network error. Please try again.");
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="border-0 shadow-xl">
                    <CardContent className="p-8 text-center">
                        {status === "loading" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Verifying...</h2>
                                <p className="text-muted-foreground text-sm">
                                    Please wait while we log you in
                                </p>
                            </motion.div>
                        )}

                        {status === "success" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto mb-4 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Welcome Back!</h2>
                                <p className="text-muted-foreground text-sm">
                                    Redirecting to your child's timeline...
                                </p>
                            </motion.div>
                        )}

                        {status === "error" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                                    <XCircle className="h-8 w-8 text-destructive" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    {error || "This magic link is no longer valid."}
                                </p>
                                <div className="space-y-2">
                                    <Button asChild className="w-full">
                                        <Link href="/auth/magic-link">Request New Link</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/auth/login">Back to Login</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function MagicLinkVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
