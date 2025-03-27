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
  contentTransformer?: (content: Record<string, string[]>, rawResults: any[]) => Record<string, string[]>;
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
  contentTransformer?: (content: Record<string, string[]>, rawResults: any[]) => Record<string, string[]>;
  /** Optional model name to filter by */
  model?: string;
  /** Optional query to filter content */
  query?: Record<string, any>;
  /** Custom fetch implementation (useful for server environments like Next.js) */
  fetchImplementation?: typeof fetch;
}

/**
 * Default text field names to look for in Builder.io content
 * @private
 * @constant {string[]}
 */
const DEFAULT_TEXT_FIELDS = ["text", "title", "textContent", "description"];

/**
 * Clean HTML tags and trim text
 * @private
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text: string): string {
  return String(text)
    .replace(/<[^>]*>/g, "")
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
 * @returns {Record<string, string[]>} Formatted content organized by page title
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
): Record<string, string[]> {
  const { 
    locale = "us-en",
    textFields = [],
    contentTransformer
  } = options;

  // Combine default and custom text fields
  const allTextFields = [...new Set([...DEFAULT_TEXT_FIELDS, ...textFields])];
  let formattedContent: Record<string, string[]> = {};

  // Process each result and extract locale-specific content
  builderResults.forEach((result: any) => {
    const pageTitle = result.data?.title || result.name || `Page-${result.id}`;
    const pageTexts = result.data?.blocks
      ? extractTextFieldsFromObject(result.data.blocks, { locale, textFields: allTextFields })
      : [];

    if (pageTexts.length > 0) {
      formattedContent[pageTitle] = pageTexts;
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
 * @returns {Promise<Record<string, string[]>>} Promise resolving to formatted content
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
): Promise<Record<string, string[]>> {
  const {
    locale = "us-en",
    apiUrl = "https://cdn.builder.io/api/v3/content",
    limit = 100,
    textFields = [],
    contentTransformer,
    model = "page",
    query = {},
    fetchImplementation
  } = options;

  if (!apiKey) {
    throw new Error("Builder API key is required");
  }

  // Build the API URL with query parameters
  let url = `${apiUrl}/${model}?apiKey=${apiKey}&limit=${limit}`;
  
  // Add custom query parameters
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
    }
  });

  // Use the provided fetch implementation or default fetch
  const fetchFn = fetchImplementation || fetch;

  const response = await fetchFn(url);
      
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    console.warn("No results found.");
    return {};
  }

  // Extract content
  return extractBuilderContent(data.results, {
    locale,
    textFields,
    contentTransformer
  });
}
