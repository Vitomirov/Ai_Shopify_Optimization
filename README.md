# 🧠 AI Shopify Analyzer

AI Shopify Analyzer is a fullstack application that analyzes Shopify stores and generates actionable recommendations to improve conversion, SEO, and user experience using AI.

---

## 🚀 What the app does

1. User enters a Shopify store URL
2. The app:

   * scrapes key data from the website (title, meta, structure, content)
   * sends that data to an AI model
3. The AI returns:

   * **a summary analysis**
   * **the biggest improvement opportunity**
   * **actionable recommendations (SEO, UX, Conversion, etc.)**
4. Results are displayed in a AI-style interface (similar to ChatGPT/Gemini)

---

## 🧱 Tech Stack

* **Frontend & Backend:** Next.js (App Router)
* **UI:** React (Client Components)
* **AI Integration:** OpenAI API
* **Web Scraping:** Cheerio
* **Styling:** Tailwind CSS

---

## 🏗️ Architecture

```
app/
  page.tsx                → frontend (UI)
  api/
    analyze/
      route.ts            → backend API endpoint

lib/
  services/
    shopifyScraper.ts     → scraping logic
    openAiService.ts      → AI integration
```

### Data Flow:

```
User Input (URL)
        ↓
Frontend (page.tsx)
        ↓
POST /api/analyze
        ↓
route.ts (backend)
        ↓
Scraper + AI processing
        ↓
JSON response
        ↓
UI renders results
```

---

## ⚙️ Getting Started (Development)

### 1. Install dependencies

```bash
npm install
```

---

### 2. Run development server

```bash
npm run dev
```

---

### 3. Open in browser

```
http://localhost:3000
```


---

## 🔑 Environment Variables

Create a `.env` file in the root of the project:

```
OPENAI_API_KEY=your_api_key_here
```

---

## ⚠️ Notes

* The project is currently in **development phase**
* Scraping reliability depends on the structure of the target Shopify store
* AI output quality depends on the scraped input data

---

## 🎯 Roadmap

* Streaming AI responses (real-time typing effect)
* Analysis history (store previous results)
* Store scoring system
* Authentication (user accounts)
* Analytics view

---

