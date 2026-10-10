import { Suspense } from "react";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata = { title: "Sign in — ShopDesk" };

export default function LoginPage() {
  // LoginScreen reads ?shop= on the client, which must sit under a Suspense boundary.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <LoginScreen />
    </Suspense>
  );
}
