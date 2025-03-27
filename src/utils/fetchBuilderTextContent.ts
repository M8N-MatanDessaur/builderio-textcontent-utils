/**
 * Server-side utility to fetch and extract text content from Builder.io API
 * @file fetchBuilderTextContent.ts
 */

// Define TypeScript interfaces
export interface BuilderContent {
  [pageTitle: string]: string[];
}

interface BuilderResponse {
  results?: {
    data?: {
      title?: string;
      blocks?: any[];
      [key: string]: any;
    };
    [key: string]: any;
  }[];
  [key: string]: any;
}

/**
 * Fetches and processes content from Builder.io API
 * @param apiKey - Builder.io API key
 * @param locale - Locale for content (default: "us-en")
 * @returns Promise containing content and error status
 */
export async function fetchBuilderTextContent(
  apiKey: string,
  locale: string = "us-en"
): Promise<{ content: BuilderContent; error: string | null }> {
  const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}&limit=100`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for fresh data
    const data: BuilderResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn("No results found.");
      return { content: {}, error: null };
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

    // Process each result and extract locale-specific content
    data.results.forEach((result) => {
      const pageTitle = result.data?.title || "Untitled";
      const pageTexts = result.data?.blocks
        ? extractTextFields(result.data.blocks)
        : [];

      if (pageTexts.length > 0) {
        formattedContent[pageTitle] = pageTexts;
      }
    });

    return { content: formattedContent, error: null };
  } catch (err: any) {
    console.error("Error fetching content:", err);
    return { content: {}, error: err.message };
  }
}

export default fetchBuilderTextContent;
