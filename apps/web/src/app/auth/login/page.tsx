"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Baby,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Shield,
    Sparkles,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const [email, setEmail] = useState("demo@nurseryhub.co.uk");
    const [password, setPassword] = useState("demo123");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email, password);
            toast.success("Welcome back! Redirecting to dashboard...");
        } catch (error: any) {
            toast.error(error.message || "Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-mesh relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />

                <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="icon-container h-14 w-14">
                            <Baby className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gradient">NurseryHub</span>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
                        Welcome back to
                        <span className="text-gradient block">Nursery Excellence</span>
                    </h1>

                    <p className="text-lg text-muted-foreground mb-10 max-w-md">
                        Manage your nursery with confidence. Track attendance, log care activities,
                        and keep parents connected - all in one beautiful platform.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: Shield, text: "EYFS Compliant & Ofsted Ready" },
                            { icon: Sparkles, text: "Real-time Parent Updates" },
                            { icon: Lock, text: "Bank-grade Security & GDPR" },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3 text-muted-foreground"
                            >
                                <div className="glass-subtle p-2 rounded-lg">
                                    <feature.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span>{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Decorative orbs */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
            </motion.div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="icon-container h-10 w-10">
                            <Baby className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient">NurseryHub</span>
                    </div>

                    <div className="glass-strong rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
                            <p className="text-muted-foreground">
                                Enter your credentials to access your nursery dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@nursery.co.uk"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 input-premium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 input-premium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full btn-premium h-12 text-base"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <p className="glass-subtle px-3 py-2 rounded-lg inline-block">
                                Demo: <code className="text-primary">demo@nurseryhub.co.uk</code> / <code className="text-primary">demo123</code>
                            </p>
                        </div>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            New nursery?{" "}
                            <Link href="/auth/register" className="text-primary hover:underline font-medium">
                                Start your free trial
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
