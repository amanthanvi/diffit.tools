import posthog from "posthog-js";

export const initAnalytics = () => {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
      },
    });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.identify(userId, traits);
  }
};

export const resetUser = () => {
  if (typeof window !== "undefined") {
    posthog.reset();
  }
};