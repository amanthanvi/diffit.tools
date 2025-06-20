import { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@diffit/ui/button";
import { Card } from "@diffit/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for individuals and small projects",
    features: [
      "Up to 100 diffs per month",
      "Basic text comparison",
      "Export to HTML & Markdown",
      "7-day history",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    description: "For professionals and growing teams",
    features: [
      "Unlimited diffs",
      "Advanced diff algorithms",
      "All export formats",
      "90-day history",
      "Real-time collaboration",
      "API access (1000 calls/month)",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$49",
    description: "For teams that need more control",
    features: [
      "Everything in Pro",
      "Unlimited API calls",
      "Team management",
      "SSO/SAML",
      "Custom integrations",
      "1-year history",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Simple, Transparent Pricing
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Choose the perfect plan for your needs. Always flexible to scale
                up or down.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative p-8 ${
                    plan.popular
                      ? "ring-2 ring-primary shadow-xl"
                      : "shadow-lg"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <p className="mt-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "$0" && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </p>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="mx-auto mt-24 max-w-2xl">
              <h2 className="text-2xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-2">
                    Can I change plans later?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes! You can upgrade or downgrade your plan at any time.
                    Changes take effect immediately, and we'll prorate the
                    difference.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards, debit cards, and can also
                    arrange invoicing for Team plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Is there a free trial?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes! All paid plans come with a 14-day free trial. No
                    credit card required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}