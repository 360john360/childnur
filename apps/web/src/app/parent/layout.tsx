"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    MessageSquare,
    User,
    LogOut,
    ChevronDown,
    Baby,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyChildren } from "@/hooks/use-parent";
import { cn } from "@/lib/utils";

// Context for selected child
interface SelectedChildContextType {
    selectedChildId: string | null;
    setSelectedChildId: (id: string) => void;
    children: any[];
}

const SelectedChildContext = createContext<SelectedChildContextType>({
    selectedChildId: null,
    setSelectedChildId: () => { },
    children: [],
});

export function useSelectedChild() {
    return useContext(SelectedChildContext);
}

export default function ParentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: myChildren, isLoading } = useMyChildren();

    // Auto-select first child
    useEffect(() => {
        if (myChildren && myChildren.length > 0 && !selectedChildId) {
            setSelectedChildId(myChildren[0].id);
        }
    }, [myChildren, selectedChildId]);

    const selectedChild = myChildren?.find((c) => c.id === selectedChildId);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/auth/login");
    };

    const navigation = [
        { name: "Timeline", href: "/parent", icon: Home },
        { name: "Messages", href: "/parent/messages", icon: MessageSquare },
        { name: "Profile", href: "/parent/profile", icon: User },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <SelectedChildContext.Provider
            value={{
                selectedChildId,
                setSelectedChildId,
                children: myChildren || [],
            }}
        >
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                {/* Mobile Header */}
                <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b md:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Child Selector */}
                        {myChildren && myChildren.length > 1 ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2 h-auto p-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedChild?.profilePhotoUrl || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {selectedChild?.firstName?.[0]}
                                                {selectedChild?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">
                                            {selectedChild?.firstName}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {myChildren.map((child) => (
                                        <DropdownMenuItem
                                            key={child.id}
                                            onClick={() => setSelectedChildId(child.id)}
                                        >
                                            <Avatar className="h-6 w-6 mr-2">
                                                <AvatarFallback className="text-xs">
                                                    {child.firstName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            {child.firstName} {child.lastName}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Baby className="h-5 w-5 text-primary" />
                                <span className="font-semibold">
                                    {selectedChild?.firstName}'s Day
                                </span>
                            </div>
                        )}

                        {/* Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.nav
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t overflow-hidden"
                            >
                                <div className="px-4 py-2 space-y-1">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </button>
                                </div>
                            </motion.nav>
                        )}
                    </AnimatePresence>
                </header>

                {/* Desktop Layout */}
                <div className="hidden md:flex">
                    {/* Sidebar */}
                    <aside className="w-64 min-h-screen bg-card border-r p-4 flex flex-col">
                        {/* Logo / Branding */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Baby className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Parent Portal</h1>
                                <p className="text-xs text-muted-foreground">Sunflower Nursery</p>
                            </div>
                        </div>

                        {/* Child Selector */}
                        {myChildren && myChildren.length > 1 && (
                            <div className="mb-6">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                                    Viewing
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between h-auto py-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {selectedChild?.firstName?.[0]}
                                                        {selectedChild?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-left">
                                                    <div className="font-medium">
                                                        {selectedChild?.firstName} {selectedChild?.lastName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {selectedChild?.room?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {myChildren.map((child) => (
                                            <DropdownMenuItem
                                                key={child.id}
                                                onClick={() => setSelectedChildId(child.id)}
                                                className={cn(
                                                    child.id === selectedChildId && "bg-accent"
                                                )}
                                            >
                                                <Avatar className="h-6 w-6 mr-2">
                                                    <AvatarFallback className="text-xs">
                                                        {child.firstName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div>{child.firstName} {child.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {child.room?.name}
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">{children}</main>
                </div>

                {/* Mobile Content */}
                <main className="md:hidden pb-20">{children}</main>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t md:hidden">
                    <div className="flex justify-around py-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-xs">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>
        </SelectedChildContext.Provider>
    );
}
