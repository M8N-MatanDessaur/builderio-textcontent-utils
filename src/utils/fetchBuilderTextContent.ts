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
 * Basic map for decoding common named HTML entities.
 */
const namedEntities: { [key: string]: string } = {
  amp: '&',  lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™',
  // Add more common entities if needed
};

/**
 * Decodes HTML character entities (named, decimal, hexadecimal) without external libs.
 */
const decodeHtmlEntities = (text: string): string => {
  return text.replace(
    /&(?:#([0-9]+)|#x([0-9a-fA-F]+)|([a-zA-Z0-9]+));/g, // Adjusted named entity part
    (match, dec, hex, name) => {
      if (dec) return String.fromCharCode(parseInt(dec, 10));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      if (name && namedEntities.hasOwnProperty(name)) return namedEntities[name];
      return match; // Keep unrecognized entities as is
    }
  );
};

/**
 * Cleans text: Removes HTML, Decodes Entities, Removes ** * _ formatting, Normalizes whitespace.
 */
const cleanText = (text: string | any): string => {
  let cleaned = String(text);

  // 1. Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 2. Decode HTML entities (Corrected approach)
  cleaned = decodeHtmlEntities(cleaned);

  // 3. Remove specific Markdown formatting (using slightly safer regexes)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  // Use lookarounds for * and _ to avoid removing them within words.
  // This targets * or _ surrounded by non-word characters or start/end of line.
  cleaned = cleaned.replace(/(?<!\w)[*_](?!\s)(.+?)(?<!\s)[*_](?!\w)/g, '$1'); // Italic/Underscore

  // 4. Normalize whitespace (replace multiple spaces/newlines with single space)
  cleaned = cleaned.replace(/\s+/g, " ");

  // 5. Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
};

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
  // Ensure API key is provided
  if (!apiKey) {
    console.error("Builder.io API key is required.");
    return { content: {}, error: "Builder.io API key is required." };
  }

  // Optimize API call by requesting only necessary fields
  const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}&limit=100&fields=data.title,data.blocks`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching

    // Check for fetch errors (like 4xx, 5xx)
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching content: ${response.status} ${response.statusText}`, errorText);
      return { content: {}, error: `Failed to fetch content: ${response.status} ${response.statusText}` };
    }

    const data: BuilderResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn("No results found from Builder.io API.");
      return { content: {}, error: null };
    }

    // Function to recursively extract text fields based on the specified locale
    const extractTextFields = (obj: any): string[] => {
      let texts: string[] = [];

      if (typeof obj === "object" && obj !== null) {
        // Handle LocalizedValue directly
        if (obj["@type"] === "@builder.io/core:LocalizedValue") {
          const localizedText = obj[locale] || obj["Default"];
          if (localizedText && typeof localizedText === 'string') {
             const cleaned = cleanText(localizedText);
             if (cleaned) texts.push(cleaned); // Only add if non-empty
          }
          return texts; // Don't recurse further into LocalizedValue internals
        }

        // Iterate through object properties or array elements
        Object.entries(obj).forEach(([key, value]) => {
           // Check common text-holding keys (expand this list as needed)
           const lowerKey = key.toLowerCase();
           if (
             ["text", "title", "heading", "subheading", "description", "caption", "label", "buttontext", "alttext", "name", "content", "plaintext", "summary", "testimonial", "blockquote"].includes(lowerKey) &&
             typeof value === "string" &&
             value.trim()
           ) {
             const cleaned = cleanText(value);
             if (cleaned) texts.push(cleaned); // Only add if non-empty
           }
           // Recurse into nested objects or arrays
           else if (typeof value === "object" && value !== null) {
             texts = texts.concat(extractTextFields(value));
           }
           // Handle arrays which might contain strings or objects
           else if (Array.isArray(value)) {
              value.forEach(item => {
                  if (typeof item === 'string' && item.trim()) {
                      const cleaned = cleanText(item);
                      if (cleaned) texts.push(cleaned);
                  } else if (typeof item === 'object' && item !== null) {
                      texts = texts.concat(extractTextFields(item));
                  }
              });
           }
        });
      } else if (typeof obj === 'string' && obj.trim()) {
          // Handle cases where obj itself is just a string block
          const cleaned = cleanText(obj);
          if (cleaned) texts.push(cleaned);
      }

      // Return unique, non-empty strings
      return [...new Set(texts)].filter(Boolean);
    };

    let formattedContent: BuilderContent = {};

    // Process each result and extract locale-specific content
    data.results.forEach((result, index) => {
      // Clean the title and provide a fallback
      const rawTitle = result.data?.title;
      const cleanedTitle = rawTitle ? cleanText(rawTitle) : '';
      const pageTitle = cleanedTitle || `Untitled Page ${index + 1}`; // Use cleaned title or fallback

      const pageTexts = result.data?.blocks
        ? extractTextFields(result.data.blocks)
        : [];

       // Add cleaned title to the list if it's not empty and not already found
      if (cleanedTitle && !pageTexts.includes(cleanedTitle)) {
         pageTexts.unshift(cleanedTitle);
      }

      if (pageTexts.length > 0) {
         // Merge content if title already exists, otherwise create new entry
         if (formattedContent[pageTitle]) {
            // Use Set to efficiently merge and deduplicate
            const existingTexts = new Set(formattedContent[pageTitle]);
            pageTexts.forEach(text => existingTexts.add(text));
            formattedContent[pageTitle] = Array.from(existingTexts);
         } else {
           formattedContent[pageTitle] = pageTexts; // Assign directly if new title
         }
      }
    });

    return { content: formattedContent, error: null };
  } catch (err: any) {
    console.error("Error processing Builder.io content:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { content: {}, error: `Error processing content: ${errorMessage}` };
  }
}

export default fetchBuilderTextContent;