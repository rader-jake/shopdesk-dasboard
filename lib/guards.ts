import { notFound } from "next/navigation";
import { getShop, hasFeature } from "@/config/shops";
import type { Feature } from "@/config/types";

/** 404s unless this shop exists and has the feature turned on. Call at the top of a page. */
export async function requireFeature(params: Promise<{ shopId: string }>, feature: Feature): Promise<void> {
  const { shopId } = await params;
  const shop = getShop(shopId);
  if (!shop || !hasFeature(shop, feature)) notFound();
}
