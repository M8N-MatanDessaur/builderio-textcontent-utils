import { BuilderPageContent } from './extractBuilderContent';
import { cleanText } from './textCleaner';

/**
 * Search interface to represent a search result
 */
export interface SearchResult {
  /** Title of the page containing the match */
  pageTitle: string;
  /** URL of the page containing the match */
  pageUrl: string;
  /** Full text containing the match */
  text: string;
  /** Score representing match relevance */
  matchScore: number;
  /** Context excerpt showing words around the match */
  excerpt: string;
  /** Position of the match in the text */
  matchPosition: number;
}

/**
 * Search options to configure search behavior
 */
export interface SearchOptions {
  /** Whether search is case-sensitive (default: false) */
  caseSensitive?: boolean;
  /** Whether to match whole words only (default: false) */
  wholeWord?: boolean;
  /** Minimum score to include in results (default: 0.1) */
  minScore?: number;
  /** Number of words to include before and after match (default: 5) */
  contextWords?: number;
}

/**
 * Search through Builder.io content for matching text
 * @param content - The Builder.io content to search through
 * @param searchTerm - The term to search for
 * @param options - Search configuration options
 * @returns Array of search results sorted by relevance
 * 
 * @example
 * ```typescript
 * const results = searchBuilderContent(content, 'search term', {
 *   caseSensitive: false,
 *   contextWords: 8
 * });
 * ```
 */
export function searchBuilderContent(
  content: BuilderPageContent[],
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  
  // Clean the search term of any formatting or HTML entities
  const cleanedSearchTerm = cleanText(searchTerm);
  
  const {
    caseSensitive = false,
    wholeWord = false,
    minScore = 0.1,
    contextWords = 5
  } = options;

  const normalizedSearchTerm = caseSensitive ? cleanedSearchTerm : cleanedSearchTerm.toLowerCase();
  const results: SearchResult[] = [];

  // Create whole word regex pattern if needed
  const wholeWordRegex = wholeWord 
    ? new RegExp(`\\b${escapeRegExp(normalizedSearchTerm)}\\b`, caseSensitive ? 'g' : 'gi')
    : null;

  // Process each page and its text content
  content.forEach((page) => {
    // Ensure content is an array
    if (!Array.isArray(page.content)) {
      console.warn(`Expected content for "${page.title}" to be an array, got ${typeof page.content}`);
      return; // Skip this entry
    }
    
    page.content.forEach((text) => {
      // Clean the text of any formatting or HTML entities
      const cleanedText = cleanText(text);
      const normalizedText = caseSensitive ? cleanedText : cleanedText.toLowerCase();
      
      // Calculate match score 
      let matchScore = 0;
      let matchFound = false;
      let matchPosition = -1;

      // Check for whole word matches first (higher score)
      if (wholeWord && wholeWordRegex) {
        // Reset regex lastIndex
        wholeWordRegex.lastIndex = 0;
        let match;
        while ((match = wholeWordRegex.exec(cleanedText)) !== null) {
          matchScore += 2; // Whole word matches get higher score
          matchFound = true;
          matchPosition = match.index;
          
          // Generate excerpt for this match
          const excerpt = generateExcerpt(cleanedText, match.index, match[0].length, contextWords);
          
          results.push({
            pageTitle: page.title,
            pageUrl: page.url,
            text: cleanedText,
            matchScore: calculateFinalScore(matchScore, cleanedText.length),
            excerpt,
            matchPosition: match.index
          });
        }
      }
      
      // Check for partial matches if no whole word search
      if (!wholeWord) {
        let position = normalizedText.indexOf(normalizedSearchTerm);
        while (position !== -1) {
          matchScore += 1;
          matchFound = true;
          matchPosition = position;
          
          // Generate excerpt for this match
          const excerpt = generateExcerpt(cleanedText, position, normalizedSearchTerm.length, contextWords);
          
          results.push({
            pageTitle: page.title,
            pageUrl: page.url,
            text: cleanedText,
            matchScore: calculateFinalScore(matchScore, cleanedText.length),
            excerpt,
            matchPosition: position
          });
          
          position = normalizedText.indexOf(normalizedSearchTerm, position + 1);
        }
      }
    });
  });

  // Filter by minimum score
  const filteredResults = results.filter(result => result.matchScore >= minScore);
  
  // Sort by match score (descending)
  return filteredResults.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate the final score for a match, adjusting for text length
 * @param baseScore - The base score from match count
 * @param textLength - Length of the text containing matches
 * @returns Adjusted score
 */
function calculateFinalScore(baseScore: number, textLength: number): number {
  // Boost score for shorter texts with matches (more precise matches)
  return baseScore * (50 / Math.max(textLength, 50));
}

/**
 * Generate an excerpt showing context around a match
 * @param text - Full text containing the match
 * @param matchIndex - Start position of match in the text
 * @param matchLength - Length of the matching text
 * @param contextWords - Number of words to include before and after
 * @returns Excerpt with context
 */
function generateExcerpt(
  text: string, 
  matchIndex: number, 
  matchLength: number, 
  contextWords: number
): string {
  // Ensure text is cleaned of any formatting before generating excerpt
  const cleanedText = cleanText(text);
  
  // Split the text into words
  const words = cleanedText.split(/\s+/);
  const fullWordArray: {word: string, isMatch: boolean}[] = [];
  
  // Track current position in the text
  let currentPosition = 0;
  
  // Map each word with its position information
  words.forEach(word => {
    const startPos = cleanedText.indexOf(word, currentPosition);
    const endPos = startPos + word.length;
    
    // Check if this word is part of the match
    const wordOverlapsMatch = 
      (startPos <= matchIndex + matchLength - 1) && 
      (endPos > matchIndex);
    
    fullWordArray.push({
      word,
      isMatch: wordOverlapsMatch
    });
    
    currentPosition = endPos;
  });
  
  // Find the index of the first matched word
  const matchWordIndex = fullWordArray.findIndex(w => w.isMatch);
  
  if (matchWordIndex === -1) {
    // Fallback if word detection failed
    return cleanedText.substring(
      Math.max(0, matchIndex - 50),
      Math.min(cleanedText.length, matchIndex + matchLength + 50)
    );
  }
  
  // Calculate start and end indices for the excerpt
  const startIndex = Math.max(0, matchWordIndex - contextWords);
  const endIndex = Math.min(fullWordArray.length, matchWordIndex + contextWords + 1);
  
  // Build the excerpt - plain text only, no styling
  let excerpt = '';
  if (startIndex > 0) excerpt += '... ';
  
  excerpt += fullWordArray
    .slice(startIndex, endIndex)
    .map(item => item.word)
    .join(' ');
  
  if (endIndex < fullWordArray.length) excerpt += ' ...';
  
  return excerpt;
}

/**
 * Count occurrences of a substring within a string
 * @param text - The text to search in
 * @param searchTerm - The term to search for
 * @returns Number of occurrences
 */
function countOccurrences(text: string, searchTerm: string): number {
  if (!text || !searchTerm) return 0;
  
  let count = 0;
  let position = text.indexOf(searchTerm);
  
  while (position !== -1) {
    count++;
    position = text.indexOf(searchTerm, position + 1);
  }
  
  return count;
}

/**
 * Escape special characters for use in a regular expression
 * @param string - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
