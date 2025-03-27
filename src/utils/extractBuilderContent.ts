/**
 * @file Builder.io content extraction utilities
 * @module @builder-io/content-utils/extractBuilderContent
 * @description Server-side utilities for fetching and extracting text content from Builder.io
 */

/**
 * Configuration options for extracting text content from Builder.io content
 * @typedef {Object} ExtractBuilderContentOptions
 */
export interface ExtractBuilderContentOptions {
  /** Content locale (defaults to 'us-en' if not provided) */
  locale?: string;
  /** Additional text field names to extract beyond the defaults */
  textFields?: string[];
  /** Custom content transformer function */
  contentTransformer?: (content: BuilderPageContent[], rawResults: any[]) => BuilderPageContent[];
}

/**
 * Configuration options for fetching content from Builder.io
 * @typedef {Object} FetchBuilderContentOptions
 */
export interface FetchBuilderContentOptions {
  /** Content locale (defaults to 'us-en' if not provided) */
  locale?: string;
  /** API base URL (defaults to standard Builder.io API URL) */
  apiUrl?: string;
  /** Number of items to fetch (defaults to 100) */
  limit?: number;
  /** Additional text field names to extract beyond the defaults */
  textFields?: string[];
  /** Custom content transformer function */
  contentTransformer?: (content: BuilderPageContent[], rawResults: any[]) => BuilderPageContent[];
  /** Optional model name to filter by */
  model?: string;
  /** Optional query to filter content */
  query?: Record<string, any>;
  /** Custom fetch implementation (useful for server environments like Next.js) */
  fetchImplementation?: typeof fetch;
}

/**
 * Structure for a single page of Builder.io content
 * @typedef {Object} BuilderPageContent
 */
export interface BuilderPageContent {
  /** The page title */
  title: string;
  /** The page URL */
  url: string;
  /** The extracted text content */
  content: string[];
}

/**
 * Default text field names to look for in Builder.io content
 * @private
 * @constant {string[]}
 */
const DEFAULT_TEXT_FIELDS = ["text", "title", "textContent", "description"];

/**
 * Clean HTML tags, entities, and markdown formatting from text
 * @private
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text: string): string {
  if (!text) return "";
  
  return String(text)
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Replace common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Replace decimal and hex HTML entities
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Remove markdown formatting symbols
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1")     // Italic
    .replace(/\_\_(.+?)\_\_/g, "$1") // Bold
    .replace(/\_(.+?)\_/g, "$1")     // Italic
    .replace(/\~\~(.+?)\~\~/g, "$1") // Strikethrough
    .replace(/\`(.+?)\`/g, "$1")     // Code
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts text fields from an object based on the specified locale
 * @private
 * @param {any} obj - Object to extract text from
 * @param {Object} options - Extraction options
 * @param {string} options.locale - Content locale
 * @param {string[]} options.textFields - Field names to extract
 * @returns {string[]} Array of extracted texts
 */
function extractTextFieldsFromObject(
  obj: any,
  options: {
    locale: string;
    textFields: string[];
  }
): string[] {
  const { locale, textFields } = options;
  let texts: string[] = [];

  if (typeof obj === "object" && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      // Handle localized text from Builder.io
      if (
        key === "@type" &&
        value === "@builder.io/core:LocalizedValue"
      ) {
        const localizedText = obj[locale] || obj["Default"];
        if (localizedText) {
          texts.push(cleanText(localizedText));
        }
      }

      // Extract text from specified field names
      if (
        textFields.includes(key) &&
        typeof value === "string"
      ) {
        texts.push(cleanText(value as string));
      }

      // Recursively process nested objects
      if (typeof value === "object" && value !== null) {
        texts = texts.concat(extractTextFieldsFromObject(value, { locale, textFields }));
      }
    });
  }

  return texts;
}

/**
 * Extracts text content from Builder.io content
 * 
 * @public
 * @param {any[]} builderResults - Raw Builder.io API results
 * @param {ExtractBuilderContentOptions} [options={}] - Configuration options
 * @returns {BuilderPageContent[]} Formatted content organized by pages
 * @example
 * ```typescript
 * // Extract text from raw Builder.io results
 * const content = extractBuilderContent(builderData, {
 *   locale: 'en-US',
 *   textFields: ['subtitle', 'buttonText']
 * });
 * ```
 */
export function extractBuilderContent(
  builderResults: any[],
  options: ExtractBuilderContentOptions = {}
): BuilderPageContent[] {
  const { 
    locale = "us-en",
    textFields = [],
    contentTransformer
  } = options;

  // Combine default and custom text fields
  const allTextFields = [...new Set([...DEFAULT_TEXT_FIELDS, ...textFields])];
  let formattedContent: BuilderPageContent[] = [];

  // Process each result and extract locale-specific content
  builderResults.forEach((result: any) => {
    const pageTitle = result.data?.title || result.name || `Page-${result.id}`;
    const pageUrl = result.data?.url || result.data?.path || "#";
    const pageTexts = result.data?.blocks
      ? extractTextFieldsFromObject(result.data.blocks, { locale, textFields: allTextFields })
      : [];

    if (pageTexts.length > 0) {
      formattedContent.push({
        title: pageTitle,
        url: pageUrl,
        content: pageTexts
      });
    }
  });

  // Apply custom transformer if provided
  if (typeof contentTransformer === 'function') {
    formattedContent = contentTransformer(formattedContent, builderResults);
  }

  return formattedContent;
}

/**
 * Fetches content from Builder.io and extracts text content
 * This function is designed to work in server environments like Next.js API routes
 * 
 * @public
 * @async
 * @param {string} apiKey - Builder.io API key
 * @param {FetchBuilderContentOptions} [options={}] - Configuration options
 * @returns {Promise<BuilderPageContent[]>} Promise resolving to formatted content
 * @throws {Error} Throws if API key is missing or if the API request fails
 * @example
 * ```typescript
 * // In a Next.js server component
 * const content = await fetchBuilderContent('YOUR_API_KEY', {
 *   locale: 'en-US',
 *   model: 'page',
 *   query: { 'data.slug': 'home' }
 * });
 * ```
 */
export async function fetchBuilderContent(
  apiKey: string,
  options: FetchBuilderContentOptions = {}
): Promise<BuilderPageContent[]> {
  const {
    locale = "us-en",
    apiUrl = "https://cdn.builder.io/api/v3/content",
    limit = 100,
    textFields = [],
    model = "page",
    query = {},
    contentTransformer,
    fetchImplementation = fetch
  } = options;

  if (!apiKey) {
    throw new Error("Builder.io API key is required");
  }

  try {
    // Construct API URL with query parameters
    let apiUrlWithParams = `${apiUrl}/${model}?apiKey=${encodeURIComponent(apiKey)}`;
    apiUrlWithParams += `&limit=${limit}`;
    apiUrlWithParams += `&cachebust=${Date.now()}`;

    // Add custom query parameters
    Object.entries(query).forEach(([key, value]) => {
      apiUrlWithParams += `&${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
    });

    // Fetch content from Builder.io
    const response = await fetchImplementation(apiUrlWithParams);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Extract and format content
    return extractBuilderContent(data.results, {
      locale,
      textFields,
      contentTransformer
    });
  } catch (error: any) {
    console.error("Error fetching Builder.io content:", error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}
