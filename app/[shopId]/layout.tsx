import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ShopApp } from "@/components/ShopApp";
import { SHOPS, getShop } from "@/config/shops";
import { fontClassName } from "@/lib/fonts";
import { themeStyle } from "@/lib/theme";

// Every client's pages are generated at build time from the shop config.
export function generateStaticParams() {
  return Object.keys(SHOPS).map((shopId) => ({ shopId }));
}

export default function ShopLayout({ children, params }: LayoutProps<"/[shopId]">) {
  // With Cache Components, awaiting `params` has to happen below a Suspense boundary.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <ShopShell params={params}>{children}</ShopShell>
    </Suspense>
  );
}

async function ShopShell({ params, children }: { params: LayoutProps<"/[shopId]">["params"]; children: ReactNode }) {
  const { shopId } = await params;
  const shop = getShop(shopId);
  if (!shop) notFound();

  // Theme + fonts are applied here, on the server, so the page never flashes the wrong brand.
  return (
    <div style={themeStyle(shop.theme)} className={`${fontClassName(shop.theme)} min-h-dvh bg-bg text-text`}>
      <ShopApp shopId={shop.id}>{children}</ShopApp>
    </div>
  );
}
