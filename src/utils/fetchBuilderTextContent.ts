/**
 * Server-side utility to fetch and extract text content from Builder.io API
 * @file fetchBuilderTextContent.ts
 */

import { BuilderPageContent } from './extractBuilderContent';

/**
 * Fetches text content from Builder.io
 * @param {string} apiKey - Builder.io API key 
 * @param {string} [locale="us-en"] - Content locale
 * @returns {Promise<{ content: BuilderPageContent[]; error: string | null }>} Promise resolving to text content
 */
export async function fetchBuilderTextContent(
  apiKey: string,
  locale: string = "us-en"
): Promise<{ content: BuilderPageContent[]; error: string | null }> {
  const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for fresh data
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn("No results found.");
      return { content: [], error: null };
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

    let formattedContent: BuilderPageContent[] = [];

    // Process each result and extract locale-specific content
    data.results.forEach((result: any) => {
      const pageTitle = result.data?.title || result.name || "Untitled";
      const pageUrl = result.data?.url || result.data?.path || "#";
      const pageTexts = result.data?.blocks
        ? extractTextFields(result.data.blocks)
        : [];

      if (pageTexts.length > 0) {
        formattedContent.push({
          title: pageTitle,
          url: pageUrl,
          content: pageTexts
        });
      }
    });

    return { content: formattedContent, error: null };
  } catch (err: any) {
    console.error("Error fetching content:", err);
    return { content: [], error: err.message };
  }
}

export default fetchBuilderTextContent;
