const LIVE_QUERY_PATTERN =
  /\b(latest|today|current|currently|news|headline|price|score|stock|weather|forecast|recent|real[- ]?time|update|updated|now|this week|this month|2026|2025)\b/i;

const decodeHtml = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDuckUrl = (rawUrl = "") => {
  try {
    const url = new URL(rawUrl, "https://duckduckgo.com");
    const redirected = url.searchParams.get("uddg");
    return redirected ? decodeURIComponent(redirected) : url.toString();
  } catch {
    return rawUrl;
  }
};

const parseHtmlResults = (html) => {
  const results = [];
  const regex =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/div>)?/g;

  for (const match of html.matchAll(regex)) {
    const url = normalizeDuckUrl(match[1]);
    const title = decodeHtml(match[2]);
    const snippet = decodeHtml(match[3] || match[4] || "");

    if (!title || !url) continue;

    results.push({ title, url, snippet });

    if (results.length >= 5) break;
  }

  return results;
};

const fetchJsonAnswer = async (query) => {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo instant answer failed with ${response.status}`);
  }

  const data = await response.json();
  const abstract = decodeHtml(data.AbstractText || data.Answer || "");

  if (!abstract) return null;

  return {
    title: data.Heading || "Instant Answer",
    url: data.AbstractURL || data.Redirect || "",
    snippet: abstract
  };
};

const fetchHtmlResults = async (query) => {
  const response = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed with ${response.status}`);
  }

  const html = await response.text();
  return parseHtmlResults(html);
};

export const shouldUseWebSearch = (query, explicit = false) =>
  Boolean(explicit) || LIVE_QUERY_PATTERN.test(query || "");

export const searchWeb = async (query) => {
  const items = [];

  try {
    const instant = await fetchJsonAnswer(query);
    if (instant) items.push(instant);
  } catch {
    // Fall back to HTML results when instant answers are unavailable.
  }

  try {
    const htmlResults = await fetchHtmlResults(query);
    for (const result of htmlResults) {
      if (!items.find((item) => item.url === result.url || item.title === result.title)) {
        items.push(result);
      }
      if (items.length >= 5) break;
    }
  } catch (error) {
    if (!items.length) {
      throw error;
    }
  }

  return items.slice(0, 5);
};

export const buildWebContext = (query, results = []) => {
  if (!results.length) return "";

  const today = new Date().toISOString().slice(0, 10);
  const lines = results.map((result, index) => {
    const parts = [`${index + 1}. ${result.title}`];
    if (result.snippet) parts.push(`Summary: ${result.snippet}`);
    if (result.url) parts.push(`Source: ${result.url}`);
    return parts.join("\n");
  });

  return [
    `Live web research for "${query}" gathered on ${today}.`,
    "Use these sources when answering time-sensitive questions. Cite them inline as [Source 1], [Source 2], etc. If the sources conflict, say so clearly.",
    ...lines
  ].join("\n\n");
};

export const formatWebSources = (results = []) =>
  results.map((result, index) => ({
    id: index + 1,
    title: result.title,
    url: result.url,
    snippet: result.snippet
  }));
