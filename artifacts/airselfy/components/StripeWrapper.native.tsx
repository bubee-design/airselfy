import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "/api";
}

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  const [publishableKey, setPublishableKey] = useState("");

  useEffect(() => {
    fetch(`${getApiBase()}/stripe/config`)
      .then((r) => r.json())
      .then((data: { publishableKey?: string }) => {
        if (data.publishableKey) setPublishableKey(data.publishableKey);
      })
      .catch(() => {});
  }, []);

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.airselfy.app"
    >
      {children}
    </StripeProvider>
  );
}
