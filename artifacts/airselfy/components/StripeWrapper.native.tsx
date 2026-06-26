import React, { useEffect, useState } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "/api";
}

let _resolveReady: (() => void) | undefined;

/**
 * Resolves once StripeProvider has been given a real publishable key.
 * Await this in topUpWithStripe before calling initPaymentSheet.
 */
export const stripeReady = new Promise<void>((resolve) => {
  _resolveReady = resolve;
});

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  const [publishableKey, setPublishableKey] = useState("");

  useEffect(() => {
    fetch(`${getApiBase()}/stripe/config`)
      .then((r) => r.json())
      .then((data: { publishableKey?: string }) => {
        if (data.publishableKey) {
          setPublishableKey(data.publishableKey);
        }
        // Resolve even on partial success so topUpWithStripe can proceed
        // (it will surface its own error if the key is still empty)
        _resolveReady?.();
      })
      .catch(() => {
        _resolveReady?.();
      });
  }, []);

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.airselfy.app"
    >
      {children as React.ReactElement}
    </StripeProvider>
  );
}
