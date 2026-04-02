import type { NextApiRequest, NextApiResponse } from "next";
import { fetchShopifyData } from "@/lib/services/shopifyScraper";
import { getAIRecommendations } from "@/lib/services/openAiService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ error: "URL is required" });

    const scrapedData = await fetchShopifyData(url);
    const recommendations = await getAIRecommendations(scrapedData);

    res.status(200).json({ success: true, scrapedData, recommendations });
  } catch (error: any) {
  if (error.message.includes("not a Shopify")) {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: "Internal server error" });
  }
}