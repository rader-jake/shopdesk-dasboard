"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CallMode } from "@/components/CallMode";
import { DashboardProvider } from "@/components/DashboardProvider";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/states";
import { getShop } from "@/config/shops";
import { useSessionShopId } from "@/lib/session";

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <Spinner />
    </div>
  );
}

/**
 * Wraps every /[shopId] page: nothing renders until we know the visitor is signed in
 * as *this* shop, otherwise they're sent to the login page. Everything below this
 * (data fetching, dates, calendar) is therefore client-only, so there's no
 * server/client mismatch to worry about.
 */
export function ShopApp({ shopId, children }: { shopId: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionShopId = useSessionShopId();
  const shop = getShop(shopId);
  const signedIn = sessionShopId === shopId;

  // The tab title names the client. (Done here, not in generateMetadata: reading `params`
  // there would stop Next from prefetching this route's metadata.) Re-applied on every
  // navigation because Next resets the title to the static default.
  useEffect(() => {
    if (shop) document.title = `${shop.name} — ShopDesk`;
  }, [shop, pathname]);

  useEffect(() => {
    if (sessionShopId !== undefined && sessionShopId !== shopId) router.replace(`/login?shop=${shopId}`);
  }, [sessionShopId, shopId, router]);

  if (!shop || !signedIn) return <Splash />;

  return (
    <DashboardProvider shop={shop}>
      <Layout>{children}</Layout>
      <CallMode />
    </DashboardProvider>
  );
}
