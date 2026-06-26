import React from "react";

export const stripeReady: Promise<void> = Promise.resolve();

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
