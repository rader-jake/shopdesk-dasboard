"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Splash } from "@/components/ShopApp";
import { getShop } from "@/config/shops";
import { useSessionShopId } from "@/lib/session";

/** "/" sends signed-in visitors to their dashboard and everyone else to the login page. */
export function RootRedirect() {
  const router = useRouter();
  const sessionShopId = useSessionShopId();

  useEffect(() => {
    if (sessionShopId === undefined) return;
    router.replace(getShop(sessionShopId) ? `/${sessionShopId}` : "/login");
  }, [sessionShopId, router]);

  return <Splash />;
}
