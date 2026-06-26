import React from "react";

/**
 * Platform stub — Metro resolves to StripeWrapper.native.tsx on iOS/Android
 * and StripeWrapper.web.tsx on web. This file is the TypeScript base used for
 * type-checking only and is never actually bundled at runtime.
 */

export const stripeReady: Promise<void> = Promise.resolve();

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
