import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIRecommendations {
  summary: string;
  recommendations: {
    Conversion: string;
    SEO: string;
    UX: string;
    Visuals: string;
    Trust: string;
  };
  biggest_opportunity: string;
  raw?: string;
}

interface ShopData {
  seo?: {
    title?: string;
    description?: string;
    headings?: string[];
  };
  theme_config?: {
    themeSchema?: Record<string, unknown> | null;
    themeData?: Record<string, unknown> | null;
  };
  css_summary?: {
    button_styles?: string;
  };
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const fallbackRecommendations: AIRecommendations = {
  summary: "AI analysis failed due to formatting error.",
  recommendations: {
    Conversion: "N/A",
    SEO: "N/A",
    UX: "N/A",
    Visuals: "N/A",
    Trust: "N/A",
  },
  biggest_opportunity: "AI could not generate recommendations.",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Sends scraped Shopify store data to OpenAI and returns structured, categorized recommendations.
 * @param shopData - Scraped store data containing seo, theme_config, and css_summary
 * @returns Structured AI recommendations JSON
 */
export const getAIRecommendations = async (shopData: ShopData): Promise<AIRecommendations> => {
  const seo = shopData.seo || {};
  const theme = shopData.theme_config || {};
  const css = shopData.css_summary || {};

  const title = seo.title || "N/A";
  const description = seo.description || "N/A";
  const headings = Array.isArray(seo.headings) ? seo.headings.join(", ") : "N/A";

  const themeKeys = theme.themeSchema ? Object.keys(theme.themeSchema).join(", ") : "N/A (No Theme Schema Keys)";
  const themeDataKeys = theme.themeData ? Object.keys(theme.themeData).join(", ") : "N/A (No Theme Data Keys)";
  const buttonStyles = typeof css.button_styles === "string" ? css.button_styles : "N/A (No CSS Button Styles)";

  const systemPrompt = `
You are a world-class Shopify Growth Analyst combining Conversion Rate Optimization (CRO), User Experience (UX), Search Engine Optimization (SEO), and front-end structural auditing.
Your primary role is to provide **exact, practical, merchant-ready fixes** categorized into 5 critical growth areas. You are NOT to give generic advice.

Core Rules for Analysis and Output:
1. **Practicality is King:** Every recommendation must contain: **what is wrong** (problem), **what is the exact fix** (solution), and **a specific, real-world example/tip** (e.g., specific copy, color, layout suggestion, competitor reference, or expected impact).
2. **Prioritization:** Treat the store like a growth consultant would: prioritize revenue-impacting issues first (CRO/Conversion).
3. **Merchant-Ready:** Assume the merchant has no technical knowledge. Instructions must be actionable without coding skills (use Theme Editor instructions).
4. **Benchmarking:** Use known Shopify UX standards and top industry competitor benchmarks (Gymshark, Huel, Glossier, etc.). Use the theme data/CSS to infer visual assumptions (e.g., if 'primary_color' is black, and 'button_styles' is small/square, make an informed Visuals recommendation).
5. **Focus Areas (5):** You must generate a highly specific recommendation for **Conversion**, **SEO**, **UX**, **Visuals**, and **Trust**.

Analyze the store data provided below, focusing on how these data points signal common structural and content issues:
- **Headings Analysis:** Detect duplicate or polluted headings (H1/H2/H3 misuse, non-SEO text in headings).
- **Theme/Layout Inference:** Use 'Theme Keys' and 'Theme Data Keys' to infer available sections and configuration patterns (e.g., is there a 'Testimonials' key? Is the 'Header' key complex?).
- **Button Styles:** Use 'Button Styles' for Visuals/Conversion recommendations (e.g., low contrast, poor sizing).
- **Content Gaps:** Is the title/description weak? Are key SEO terms missing?

OUTPUT FORMAT: Return **strictly valid JSON** in this exact, defined structure. Do not use markdown wrappers.
{
  "summary": "2–3 sentence, high-level, merchant-friendly summary of the store's current state and biggest opportunities.",
  "recommendations": {
    "Conversion": "Problem, Solution, and Tip for a revenue-blocking issue (e.g., CTA placement, copy clarity).",
    "SEO": "Problem, Solution, and Tip for an issue affecting organic visibility (e.g., heading structure, title tag).",
    "UX": "Problem, Solution, and Tip for an issue affecting usability and flow (e.g., navigation clarity, information architecture).",
    "Visuals": "Problem, Solution, and Tip for an issue affecting the design and brand presentation (e.g., color contrast, button style, implied section padding).",
    "Trust": "Problem, Solution, and Tip for an issue affecting buyer confidence (e.g., missing badges, guarantee visibility, weak social proof)."
  },
  "biggest_opportunity": "1–2 sentence statement identifying the single most revenue-impactful fix."
}
`;

  const userPrompt = `
Store data for expert analysis:

--- STORE CONTEXT ---
Title: ${title}
Description: ${description}
Headings (Detected SEO Tags): ${headings}

--- THEME STRUCTURE & CONFIGURATION SIGNALS (USE TO INFER LAYOUT) ---
Theme Keys (Available Sections/Settings): ${themeKeys}
Theme Data Keys (Active Settings): ${themeDataKeys}

--- DESIGN & STYLING SIGNALS ---
Button Styles (Inferred CSS): ${buttonStyles}

---

IMPORTANT TASKS:
1. Infer potential issues from the combined data (e.g., weak Description + poor Headings = bad SEO structure).
2. Convert every detected issue into a precise, non-technical merchant action.
3. Generate exactly one recommendation for each of the 5 categories (Conversion, SEO, UX, Visuals, Trust).

Remember:
- Do NOT give abstract advice.
- Do NOT use filler words like "consider", "maybe", or "possibly". Be confident.
- Do NOT return generic recommendations.
- Return the result in the required JSON format ONLY.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    let aiContent = response.choices[0].message.content ?? "";

    aiContent = aiContent.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(aiContent) as AIRecommendations;
    } catch (err) {
      console.error("AI returned invalid JSON. Raw content:", aiContent);
      return { ...fallbackRecommendations, raw: aiContent };
    }
  } catch (error) {
    console.error("Error in getAIRecommendations:", (error as Error).message);
    return {
      ...fallbackRecommendations,
      summary: "AI API error.",
      biggest_opportunity: "AI could not generate recommendations at this time.",
    };
  }
};