import Link from "next/link";
import {
  Baby,
  Calendar,
  ClipboardCheck,
  FileText,
  Heart,
  LineChart,
  MessageSquare,
  Shield,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Baby,
    title: "Child Management",
    description: "Comprehensive child profiles with medical info, dietary needs, and emergency contacts.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: ClipboardCheck,
    title: "Daily Care Logs",
    description: "Track nappies, sleep, meals, and activities. Parents see updates in real-time.",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "EYFS Observations",
    description: "Photo-rich learning observations linked to EYFS areas. Supports 2-Year Checks.",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Shield,
    title: "Safeguarding",
    description: "Secure accident logging with body maps and DSL-restricted safeguarding concerns.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: MessageSquare,
    title: "Parent Portal",
    description: "Real-time timeline, messaging, and digital consent forms for parents.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Wallet,
    title: "UK Billing",
    description: "Handle 15/30 hours funding, stretched offers, and Tax-Free Childcare.",
    gradient: "from-blue-500 to-indigo-600",
  },
];

const stats = [
  { value: "30+", label: "UK Nurseries" },
  { value: "99.9%", label: "Uptime" },
  { value: "5,000+", label: "Children Managed" },
  { value: "EYFS", label: "Compliant" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Navigation */}
      <nav className="glass-subtle sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="icon-container h-10 w-10">
              <Baby className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">NurseryHub</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="btn-premium">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center stagger-children">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Trusted by UK Nurseries</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-gradient">Modern</span> Early Years
              <br />
              Management for
              <br />
              <span className="text-gradient-accent">Exceptional</span> Nurseries
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The all-in-one platform that handles child profiles, daily logs, EYFS observations,
              safeguarding, parent communication, and UK-specific billing. Beautifully designed.
              GDPR compliant.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="btn-premium text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 glass-subtle border-primary/30">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Nursery Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From daily care logs to EYFS tracking, safeguarding to billing —
              all in one beautiful, compliant platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="stat-card group cursor-pointer"
              >
                <div className={`icon-container h-12 w-12 mb-4 bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Nursery?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of UK nurseries using NurseryHub to streamline operations,
            delight parents, and stay compliant.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/auth/register">
              <Button size="lg" className="btn-premium text-lg px-8 py-6">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              GDPR compliant
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-subtle border-t border-border/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="icon-container h-8 w-8">
                <Baby className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gradient">NurseryHub</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NurseryHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
