import * as cheerio from "cheerio";


const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; GenericAuditBot/1.0; +https://yourdomain.com)";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HtmlElement {
  tag: string;
  text: string;
}

export interface HtmlSections {
  header: HtmlElement[];
  main: HtmlElement[];
  footer: HtmlElement[];
}

export interface SeoData {
  title: string;
  description: string;
  headings: string[];
  html_sections: HtmlSections;
}

export interface CssSummary {
  primary_colors: string[];
  fonts: string[];
  button_styles: string;
}

export interface ThemeConfig {
  themeSchema: Record<string, unknown> | null;
  themeData: Record<string, unknown> | null;
}

export interface ShopifyScrapedData {
  seo: SeoData;
  css_summary: CssSummary;
  theme_config: ThemeConfig;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Helper: Fetch public JSON asset safely
 */
const fetchPublicJsonAsset = async (url: string): Promise<Record<string, unknown> | null> => {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "application/json, text/plain, */*",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Helper: Sanitize HTML, keep only tag names + text content
 */
const sanitizeHTML = (html: string | null | undefined): HtmlElement[] => {
  const $ = cheerio.load(html || "");

  const elements: HtmlElement[] = [];

  $("*").each((_: number, el: cheerio.Element) => {
    const tag = el.type === "tag" ? el.name.toLowerCase() : null;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (tag && text) {
      elements.push({ tag, text });
    }
  });

  return elements;
};

// ─── Scrapers ─────────────────────────────────────────────────────────────────

/**
 * Scrape SEO + content sections
 */
export const scrapePublicSEOData = async (storeUrl: string): Promise<SeoData> => {
  try {
    const res = await fetch(storeUrl, {
      headers: { "User-Agent": DEFAULT_USER_AGENT },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.text();
    const $ = cheerio.load(data);

    const title = $("title").text().trim() || "";
    const description = $('meta[name="description"]').attr("content")?.trim() || "";

    const headings = $("h1, h2, h3")
      .map((_: number, el: cheerio.Element) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 20);

    return {
      title,
      description,
      headings,
      html_sections: {
        header: sanitizeHTML($("header").html()),
        main: sanitizeHTML($("main").html()),
        footer: sanitizeHTML($("footer").html()),
      },
    };
  } catch {
    return {
      title: "",
      description: "",
      headings: [],
      html_sections: { header: [], main: [], footer: [] },
    };
  }
};

/**
 * Fetch CSS summary (colors, fonts, button styles)
 */
export const fetchCSSSummary = async (storeUrl: string): Promise<CssSummary> => {
  try {
    const res = await fetch(storeUrl, {
      headers: { "User-Agent": DEFAULT_USER_AGENT },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.text();
    const $ = cheerio.load(data);

    const inlineStyles: string[] = $("style").map((_: number, el: cheerio.Element) => $(el).html() || "").get();

    const linkHrefs: string[] = $("link[rel='stylesheet']")
      .map((_: number, el: cheerio.Element) => $(el).attr("href"))
      .get()
      .filter(Boolean);

    const externalCSS = await Promise.all(
      linkHrefs.map(async (href) => {
        const url = href.startsWith("http") ? href : storeUrl + href;
        try {
          const cssRes = await fetch(url, { headers: { "User-Agent": DEFAULT_USER_AGENT } });
          return cssRes.ok ? await cssRes.text() : "";
        } catch {
          return "";
        }
      })
    );

    const allCSS = [...inlineStyles, ...externalCSS].filter(Boolean).join(" ");

    return {
      primary_colors: [...new Set(allCSS.match(/#([0-9a-fA-F]{3,6})/g) || [])],
      fonts: [...new Set(allCSS.match(/font-family:\s*([^;]+)/gi) || [])],
      button_styles: [...new Set(allCSS.match(/button\s*{[^}]+}/gi) || [])].join(" "),
    };
  } catch {
    return { primary_colors: [], fonts: [], button_styles: "" };
  }
};

/**
 * Fetch Shopify theme JSON safely
 */
export const fetchThemeConfig = async (storeUrl: string): Promise<ThemeConfig> => {
  const paths = ["/config/settings_schema.json", "/assets/settings_data.json"];
  const [schema, data] = await Promise.all(paths.map((p) => fetchPublicJsonAsset(storeUrl + p)));
  return {
    themeSchema: schema || null,
    themeData: data || null,
  };
};

/**
 * Combined scraper for AI
 */
export const fetchShopifyData = async (storeUrl: string): Promise<ShopifyScrapedData | object> => {
  if (!storeUrl) return {};

  const [seo, css_summary, theme_config] = await Promise.all([
    scrapePublicSEOData(storeUrl),
    fetchCSSSummary(storeUrl),
    fetchThemeConfig(storeUrl),
  ]);

  return {
    seo,
    css_summary,
    theme_config,
  };
};