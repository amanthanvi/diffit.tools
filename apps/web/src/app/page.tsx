import Link from "next/link";
import { ArrowRight, Code, FileText, Users, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@diffit/ui/button";
import { Card } from "@diffit/ui/card";
import { DiffDemo } from "@/components/marketing/diff-demo";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "WebAssembly-powered diff engine processes large files instantly",
  },
  {
    icon: Code,
    title: "Syntax Highlighting",
    description: "Support for 100+ programming languages with accurate highlighting",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Share diffs and collaborate with your team in real-time",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encryption and automatic cleanup of sensitive data",
  },
  {
    icon: FileText,
    title: "Multiple Formats",
    description: "Compare text, code, JSON, PDF, and more with specialized viewers",
  },
  {
    icon: Globe,
    title: "API Access",
    description: "Integrate diff functionality into your applications with our API",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-primary/0 to-transparent" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Professional Text Comparison
                <span className="gradient-text"> Made Simple</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Compare text, code, and documents with advanced diff algorithms.
                Collaborate in real-time, track changes, and export comparisons
                with ease.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/diff">
                  <Button size="lg" className="group">
                    Start Comparing
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="lg" variant="outline">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                See It In Action
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Experience the power of our diff engine with this interactive demo
              </p>
            </div>
            <div className="mt-12">
              <DiffDemo />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful features designed for developers, writers, and teams
              </p>
            </div>
            <div className="mt-12">
              <FeatureGrid features={features} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Card className="relative overflow-hidden p-12">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to Get Started?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join thousands of developers and teams using Diffit
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Link href="/diff">
                    <Button size="lg">Try It Free</Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}