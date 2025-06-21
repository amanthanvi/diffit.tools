export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { Book, Code, Zap, Shield } from "lucide-react";
import { Card } from "@diffit/ui";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use Diffit's features and API",
};

const sections = [
  {
    title: "Getting Started",
    icon: Book,
    description: "Learn the basics of using Diffit",
    links: [
      { title: "Quick Start", href: "/docs/quickstart" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Basic Usage", href: "/docs/basic-usage" },
    ],
  },
  {
    title: "API Reference",
    icon: Code,
    description: "Integrate Diffit into your applications",
    links: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Endpoints", href: "/docs/api/endpoints" },
      { title: "SDKs", href: "/docs/api/sdks" },
    ],
  },
  {
    title: "Features",
    icon: Zap,
    description: "Explore advanced features",
    links: [
      { title: "Real-time Collaboration", href: "/docs/features/collaboration" },
      { title: "Export Options", href: "/docs/features/export" },
      { title: "Keyboard Shortcuts", href: "/docs/features/shortcuts" },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    description: "Learn about our security practices",
    links: [
      { title: "Data Protection", href: "/docs/security/data" },
      { title: "Encryption", href: "/docs/security/encryption" },
      { title: "Compliance", href: "/docs/security/compliance" },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground mb-12">
              Everything you need to know about using Diffit
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              {sections.map((section) => (
                <Card key={section.title} className="p-6">
                  <div className="flex items-start gap-4">
                    <section.icon className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {section.description}
                      </p>
                      <ul className="space-y-2">
                        {section.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="text-primary hover:underline"
                            >
                              {link.title} →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Need more help?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? We're here to help.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/support"
                  className="text-primary hover:underline"
                >
                  Contact Support →
                </Link>
                <Link
                  href="https://github.com/amanthanvi/diffit.tools"
                  className="text-primary hover:underline"
                >
                  GitHub Issues →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}