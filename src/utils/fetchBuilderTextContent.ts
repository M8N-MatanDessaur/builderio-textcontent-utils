/**
 * Server-side utility to fetch and extract text content from Builder.io API
 * @file fetchBuilderTextContent.ts
 */

// Define TypeScript interfaces
export type BuilderContent = Record<string, string[]>;
export type BuilderResponse = { results: any[] };

/**
 * Fetches text content from Builder.io
 * @param {string} apiKey - Builder.io API key 
 * @param {string} [locale="us-en"] - Content locale
 * @returns {Promise<{ content: BuilderContent; urls?: Record<string, string>; error: string | null }>} Promise resolving to text content and URLs
 */
export async function fetchBuilderTextContent(
  apiKey: string,
  locale: string = "us-en"
): Promise<{ content: BuilderContent; urls?: Record<string, string>; error: string | null }> {
  const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for fresh data
    const data: BuilderResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn("No results found.");
      return { content: {}, urls: {}, error: null };
    }

    // Function to clean HTML tags and trim text
    const cleanText = (text: string | any): string => {
      return String(text)
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Function to extract text fields based on the specified locale
    const extractTextFields = (obj: any): string[] => {
      let texts: string[] = [];

      if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (
            key === "@type" &&
            value === "@builder.io/core:LocalizedValue"
          ) {
            const localizedText = obj[locale] || obj["Default"];
            if (localizedText) {
              texts.push(cleanText(localizedText));
            }
          }

          if (
            ["text", "title", "textContent", "description"].includes(key) &&
            typeof value === "string"
          ) {
            texts.push(cleanText(value));
          }

          if (typeof value === "object" && value !== null) {
            texts = texts.concat(extractTextFields(value));
          }
        });
      }

      return texts;
    };

    let formattedContent: BuilderContent = {};
    // Object to store page URLs
    const urls: Record<string, string> = {};

    // Process each result and extract locale-specific content
    data.results.forEach((result) => {
      const pageTitle = result.data?.title || "Untitled";
      const pageTexts = result.data?.blocks
        ? extractTextFields(result.data.blocks)
        : [];

      // Extract URL from the result
      if (result.data?.url || result.data?.path) {
        urls[pageTitle] = result.data?.url || result.data?.path;
      }

      if (pageTexts.length > 0) {
        formattedContent[pageTitle] = pageTexts;
      }
    });

    return { content: formattedContent, urls, error: null };
  } catch (err: any) {
    console.error("Error fetching content:", err);
    return { content: {}, error: err.message };
  }
}

export default fetchBuilderTextContent;
