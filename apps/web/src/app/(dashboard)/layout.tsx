"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Baby,
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardCheck,
    FileText,
    Shield,
    MessageSquare,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronDown,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUnreadCount } from "@/hooks/use-messaging";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Children", href: "/children", icon: Baby },
    { name: "Daily Logs", href: "/daily-logs", icon: ClipboardCheck },
    { name: "Attendance", href: "/attendance", icon: Calendar },
    { name: "Observations", href: "/observations", icon: FileText },
    { name: "Safeguarding", href: "/safeguarding", icon: Shield },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Billing", href: "/billing", icon: Wallet },
    { name: "Staff", href: "/staff", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tenantName, setTenantName] = useState<string>("Loading...");
    const { data: unreadData } = useUnreadCount();

    useEffect(() => {
        // Read tenant name from stored user data
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setTenantName(user.tenantName || "My Nursery");
            } catch {
                setTenantName("My Nursery");
            }
        } else {
            setTenantName("My Nursery");
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-mesh flex">
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 glass-strong border-r border-border/30
          transform transition-transform duration-300 ease-in-out
          print:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b border-border/30">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="icon-container h-10 w-10">
                                <Baby className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient">NurseryHub</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 hover:bg-muted/30 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tenant selector */}
                    <div className="p-4 border-b border-border/30">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between glass-subtle">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        <span className="truncate">{tenantName}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 glass" align="start">
                                <DropdownMenuLabel>Switch Nursery</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    {tenantName}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Rainbow Kids
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`nav-link flex items-center gap-3 ${isActive ? "active" : ""}`}
                                >
                                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                                    {item.name === "Messages" && (unreadData?.unreadCount ?? 0) > 0 && (
                                        <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                                            {unreadData!.unreadCount > 99 ? '99+' : unreadData!.unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-border/30">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                                        <AvatarImage src="/avatars/user.jpg" />
                                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                            JS
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-sm">Jane Smith</p>
                                        <p className="text-xs text-muted-foreground">Manager</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 glass" align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top header */}
                <header className="glass-subtle border-b border-border/30 sticky top-0 z-30 print:hidden">
                    <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-muted/30 rounded-lg transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Search */}
                        <div className="hidden md:flex flex-1 max-w-md ml-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search children, logs, staff..."
                                    className="pl-10 input-premium w-full"
                                />
                            </div>
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-3 ml-auto">
                            {/* Theme toggle */}
                            <ThemeToggle />

                            {/* Notifications */}
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                            </Button>

                            {/* Mobile search */}
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Search className="h-5 w-5" />
                            </Button>

                            {/* Time display */}
                            <div className="hidden lg:block text-right">
                                <p className="text-sm font-medium">
                                    {new Date().toLocaleDateString("en-GB", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date().toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
