"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Baby,
    Eye,
    EyeOff,
    Loader2,
    Mail,
    Lock,
    User,
    Building2,
    ArrowRight,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const benefits = [
    "14-day free trial",
    "No credit card required",
    "EYFS & Ofsted compliant",
    "GDPR secure",
    "UK-based support",
];

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        nurseryName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call - will be replaced with actual registration
            await new Promise((resolve) => setTimeout(resolve, 2000));

            toast.success("Account created!", {
                description: "Welcome to NurseryHub. Let's set up your nursery.",
            });

            router.push("/onboarding");
        } catch (error) {
            toast.error("Registration failed", {
                description: "Please check your details and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-mesh">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <div className="icon-container h-14 w-14">
                            <Baby className="h-7 w-7 text-white" />
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
                            <p className="text-muted-foreground">
                                {step === 1 ? "Tell us about yourself" : "Set up your nursery"}
                            </p>

                            {/* Progress indicator */}
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                                <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="firstName"
                                                    type="text"
                                                    placeholder="Jane"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="pl-10 input-premium h-12"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                type="text"
                                                placeholder="Smith"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="input-premium h-12"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@nursery.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="pl-10 input-premium h-12"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min 8 characters"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="pl-10 pr-10 input-premium h-12"
                                                minLength={8}
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
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="nurseryName">Nursery Name</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="nurseryName"
                                                type="text"
                                                placeholder="Sunflower Nursery"
                                                value={formData.nurseryName}
                                                onChange={(e) => setFormData({ ...formData, nurseryName: e.target.value })}
                                                className="pl-10 input-premium h-12"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        <p className="mb-2">By creating an account, you agree to our:</p>
                                        <ul className="space-y-1">
                                            <li>
                                                <Link href="/terms" className="text-primary hover:underline">
                                                    Terms of Service
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/privacy" className="text-primary hover:underline">
                                                    Privacy Policy
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                {step === 2 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        className="flex-1 h-12"
                                    >
                                        Back
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 btn-premium h-12 text-base"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : step === 1 ? (
                                        <>
                                            Continue
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Benefits */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 via-transparent to-accent/10" />

                {/* Animated orbs */}
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/25 rounded-full blur-3xl animate-pulse-glow" />
                <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

                <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="icon-container h-20 w-20 mb-8">
                            <Baby className="h-10 w-10 text-white" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold mb-4 text-gradient"
                    >
                        Join NurseryHub
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl text-muted-foreground max-w-md mb-12"
                    >
                        Trusted by hundreds of UK nurseries
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center gap-3 text-left"
                            >
                                <div className="icon-container-success h-8 w-8">
                                    <Check className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-medium">{benefit}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
