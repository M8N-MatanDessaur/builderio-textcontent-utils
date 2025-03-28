/**
 * @file Text cleaning utilities for Builder.io content
 * @description Utilities for cleaning HTML and formatting from extracted text
 */

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
 * @param text - Text containing HTML entities
 * @returns Decoded text with entities converted to characters
 */
export const decodeHtmlEntities = (text: string): string => {
  return text.replace(
    /&(?:#([0-9]+)|#x([0-9a-fA-F]+)|([a-zA-Z0-9]+));/g,
    (match, dec, hex, name) => {
      if (dec) return String.fromCharCode(parseInt(dec, 10));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      if (name && namedEntities.hasOwnProperty(name)) return namedEntities[name];
      return match; // Keep unrecognized entities as is
    }
  );
};

/**
 * Cleans text: Removes HTML tags, decodes entities, removes rich text formatting, and normalizes whitespace.
 * 
 * @param text - Text to clean
 * @returns Cleaned plain text
 * 
 * @example
 * ```typescript
 * // Returns "One Day Installation"
 * cleanText("**One** Day&nbsp;_Installation_");
 * ```
 */
export const cleanText = (text: string | any): string => {
  if (!text) return "";
  
  let cleaned = String(text);

  // 1. Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 2. Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // 3. Remove specific Markdown formatting
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');     // Italic stars
  cleaned = cleaned.replace(/\_\_(.+?)\_\_/g, '$1'); // Bold underscores
  cleaned = cleaned.replace(/\_(.+?)\_/g, '$1');     // Italic underscores
  cleaned = cleaned.replace(/\~\~(.+?)\~\~/g, '$1'); // Strikethrough
  cleaned = cleaned.replace(/\`(.+?)\`/g, '$1');     // Code

  // 4. Normalize whitespace (replace multiple spaces/newlines with single space)
  cleaned = cleaned.replace(/\s+/g, " ");

  // 5. Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
};
