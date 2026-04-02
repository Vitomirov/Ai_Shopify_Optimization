export const isShopifyStore = async (url: string): Promise<boolean> => {
  const cleanUrl = url.replace(/\/$/, "").toLowerCase();

  // 1. Check for .myshopify.com domain
  if (cleanUrl.includes(".myshopify.com")) return true;

  // 2. Try fetching /cart.js which is a common Shopify endpoint
  try {
    const res = await fetch(`${cleanUrl}/cart.js`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return true;
    }
  } catch {}

  // 3. HTML fingerprinting
  try {
    const res = await fetch(cleanUrl);
    const html = await res.text();

    const fingerprints = [
      "cdn.shopify.com",
      "window.Shopify",
      "Shopify.theme",
      "shopify-checkout",
      "ShopifyAnalytics",
    ];

    return fingerprints.some((fp) => html.includes(fp));
  } catch {
    return false;
  }
};