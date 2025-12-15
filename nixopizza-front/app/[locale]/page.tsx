"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

function isTokenNotExpired(token: string | null) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || !payload.exp) return false;
    // exp is in seconds
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export default function HomePage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "";
  const preferredLocale = typeof window !== "undefined" ? localStorage.getItem("preferred_locale") : null;
  const effectiveLocale = preferredLocale || locale || "en";
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const initialTarget = isTokenNotExpired(token)
    ? `/${effectiveLocale}/dashboard`
    : `/${effectiveLocale}/auth`;

  useEffect(() => {
    // Redirect once based on the computed initial target.
    try {
      router.replace(initialTarget);
    } catch (e) {
      console.log(e);
    }
  }, [router, initialTarget]);

  // Don't render the login page while we're deciding/redirecting.
  return null;
}
