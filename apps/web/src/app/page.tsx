"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Code2, 
  FileText, 
  Shield, 
  Globe, 
  Sparkles,
  ArrowRight,
  Check,
  GitCompare,
  Download,
  Share2,
  Palette,
  Command,
  Clock,
  Users,
  Star,
  Github,
  Twitter
} from "lucide-react";
import { SimpleFooter } from "@/components/layout/simple-footer";
import { SimpleHeader } from "@/components/layout/simple-header";
import { SimpleButton } from "@/components/simple-button";
import { DiffDemo } from "@/components/marketing/diff-demo";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Card, Badge } from "@diffit/ui";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Files Compared", value: "10M+", trend: "+12%" },
  { label: "Active Users", value: "50K+", trend: "+25%" },
  { label: "Languages Supported", value: "50+", trend: "+5" },
  { label: "Uptime", value: "99.9%", trend: "0%" },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "WebAssembly-powered diff engine handles files up to 10MB instantly",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Code2,
    title: "Syntax Highlighting",
    description: "Support for 50+ programming languages with accurate highlighting",
    gradient: "from-blue-400 to-purple-500",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "All processing happens in your browser. Your code never leaves your device",
    gradient: "from-green-400 to-teal-500",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No installation required. Works on any modern browser, any device",
    gradient: "from-purple-400 to-pink-500",
  },
];

const testimonials = [
  {
    quote: "The best diff tool I've ever used. Fast, accurate, and completely free!",
    author: "Sarah Chen",
    role: "Senior Developer at TechCorp",
    avatar: "SC",
  },
  {
    quote: "Replaced our paid diff tool with this. The WebAssembly performance is incredible.",
    author: "Mike Johnson",
    role: "CTO at StartupXYZ",
    avatar: "MJ",
  },
  {
    quote: "Love the privacy-first approach. Perfect for comparing sensitive code.",
    author: "Emma Wilson",
    role: "Security Engineer",
    avatar: "EW",
  },
];

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <SimpleHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto relative py-24 lg:py-32 px-4 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-purple-300 opacity-20 blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-blue-300 opacity-20 blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-40 right-40 h-96 w-96 rounded-full bg-pink-300 opacity-10 blur-3xl animate-pulse delay-2000" />
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                <Sparkles className="mr-2 h-4 w-4" />
                WebAssembly Powered • 100% Free • No Sign-up
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
            >
              The{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Fastest</span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>{" "}
              Diff Tool
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-xl leading-8 text-gray-600 dark:text-gray-400 sm:text-2xl max-w-3xl mx-auto"
            >
              Compare code, text, and files instantly with our blazing-fast WebAssembly engine. 
              <span className="font-semibold text-gray-900 dark:text-gray-100">No account needed.</span>
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <SimpleButton 
                href="/diff" 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20 group"
              >
                Start Comparing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </SimpleButton>
              <SimpleButton href="#demo" variant="outline" size="lg">
                <GitCompare className="mr-2 h-5 w-5" />
                See Demo
              </SimpleButton>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section id="demo" className="container mx-auto py-16 lg:py-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-6xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                See It In Action
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Try our interactive demo to experience the speed and accuracy
              </p>
            </div>
            <DiffDemo />
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto py-16 lg:py-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-6xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Packed with Power
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Everything you need to compare code and text efficiently
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setActiveFeature(index)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 p-8 transition-all hover:shadow-2xl",
                    activeFeature === index && "ring-2 ring-blue-500"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                      '--tw-gradient-from': feature.gradient ? feature.gradient.split(' ')[1] || '' : '',
                      '--tw-gradient-to': feature.gradient ? feature.gradient.split(' ')[3] || '' : '',
                    } as any}
                  />
                  
                  <div className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                    feature.gradient
                  )}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Additional Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {[
                { icon: Download, label: "Export to PDF" },
                { icon: Share2, label: "Share Links" },
                { icon: Palette, label: "Themes" },
                { icon: Command, label: "Shortcuts" },
                { icon: Clock, label: "History" },
                { icon: Users, label: "Collaborate" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-gray-50 dark:bg-gray-800 p-4 text-center"
                >
                  <item.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto py-16 lg:py-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-6xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Loved by Developers
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Join thousands of developers who trust Diffit for their daily work
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.author}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative rounded-2xl border bg-white dark:bg-gray-900 p-6"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-16 lg:py-24 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 px-8 py-16 text-center text-white shadow-2xl sm:px-16"
          >
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to supercharge your workflow?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
                Join thousands of developers using Diffit.tools every day.
                It's free, fast, and respects your privacy.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <SimpleButton
                  href="/diff"
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Start Comparing Now
                </SimpleButton>
                <SimpleButton
                  href="https://github.com/amanthanvi/diffit.tools"
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </SimpleButton>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <SimpleFooter />
    </div>
  );
}