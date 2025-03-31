/**
 * @file Builder.io content extraction utilities
 * @module @builder-io/content-utils/extractBuilderContent
 * @description Server-side utilities for fetching and extracting text content from Builder.io
 */
/**
 * Configuration options for extracting text content from Builder.io content
 * @typedef {Object} ExtractBuilderContentOptions
 */
interface ExtractBuilderContentOptions {
    /** Content locale (defaults to 'Default' if not provided) */
    locale?: string;
    /** Default locale to fall back to if the requested locale is not available */
    defaultLocale?: string;
    /** Additional text field names to extract beyond the defaults */
    textFields?: string[];
    /** Custom content transformer function */
    contentTransformer?: (content: BuilderPageContent[], rawResults: any[]) => BuilderPageContent[];
}
/**
 * Configuration options for fetching content from Builder.io
 * @typedef {Object} FetchBuilderContentOptions
 */
interface FetchBuilderContentOptions {
    /** Content locale (defaults to 'Default' if not provided) */
    locale?: string;
    /** Default locale to fall back to if the requested locale is not available */
    defaultLocale?: string;
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
interface BuilderPageContent {
    /** The page title */
    title: string;
    /** The page URL */
    url: string;
    /** The extracted text content */
    content: string[];
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
declare function extractBuilderContent(builderResults: any[], options?: ExtractBuilderContentOptions): BuilderPageContent[];
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
declare function fetchBuilderContent(apiKey: string, options?: FetchBuilderContentOptions): Promise<BuilderPageContent[]>;

/**
 * @file Builder.io server-side integration utilities
 * @module @builder-io/content-utils/builder-integration
 * @description Server-side helpers and integration utilities for Builder.io content
 */

/**
 * Options for the Builder.io content client
 * @typedef {Object} BuilderPluginOptions
 */
interface BuilderPluginOptions {
    /**
     * The API key for your Builder.io space
     * @required
     */
    apiKey: string;
    /**
     * Content locale (defaults to 'Default' if not provided)
     * @default 'Default'
     */
    locale?: string;
    /**
     * Default locale to fall back to if the requested locale is not available
     * @default 'Default'
     */
    defaultLocale?: string;
    /**
     * API URL for Builder.io (defaults to standard API URL)
     * @default 'https://cdn.builder.io/api/v3/content'
     */
    apiUrl?: string;
    /**
     * Additional text field names to extract beyond the defaults
     * @default []
     */
    textFields?: string[];
    /**
     * Custom fetch implementation for server environments
     * Useful for Next.js environments or when you need to use a custom fetch
     */
    fetchImplementation?: typeof fetch;
}
/**
 * Initialize a Builder.io content client
 * This creates a client with methods for fetching and processing Builder.io content
 *
 * @public
 * @param {BuilderPluginOptions} options - Client configuration options
 * @returns {Object} Client object with utility methods
 * @throws {Error} Throws if API key is missing
 * @example
 * ```typescript
 * // Create a reusable client
 * const builderClient = createBuilderClient({
 *   apiKey: process.env.BUILDER_API_KEY || '',
 *   locale: 'en-US'
 * });
 *
 * // Use the client to fetch content
 * const content = await builderClient.fetchTextContent({
 *   model: 'page',
 *   query: { 'data.slug': 'home' }
 * });
 * ```
 */
declare function createBuilderClient(options: BuilderPluginOptions): {
    /**
     * Fetch text content from Builder.io
     * @param {Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'defaultLocale' | 'apiUrl' | 'textFields' | 'fetchImplementation'>} [fetchOptions={}] - Additional fetch options
     * @returns {Promise<BuilderPageContent[]>} Promise resolving to text content
     */
    fetchTextContent: (fetchOptions?: Omit<FetchBuilderContentOptions, "apiKey" | "locale" | "defaultLocale" | "apiUrl" | "textFields" | "fetchImplementation">) => Promise<BuilderPageContent[]>;
    /**
     * Extract text from Builder.io content data
     * @param {any[]} builderResults - Raw Builder.io data
     * @param {Omit<ExtractBuilderContentOptions, 'locale' | 'defaultLocale' | 'textFields'>} [extractOptions] - Options for extraction
     * @returns {BuilderPageContent[]} Formatted content
     */
    extractContent: (builderResults: any[], extractOptions?: Omit<ExtractBuilderContentOptions, "locale" | "defaultLocale" | "textFields">) => BuilderPageContent[];
};
/**
 * Generate metadata from Builder.io content
 * Useful for Next.js metadata API
 *
 * @public
 * @param {BuilderPageContent[]} content - Builder.io content
 * @param {Object} [options={}] - Metadata options
 * @param {string} [options.defaultTitle='Home'] - Default title to use if no content is found
 * @param {string} [options.titlePrefix=''] - Prefix to add to the title
 * @param {string} [options.titleSuffix=''] - Suffix to add to the title
 * @param {string} [options.defaultDescription=''] - Default description to use if no content is found
 * @returns {Object} Metadata object compatible with Next.js
 * @example
 * ```typescript
 * // In a Next.js app
 * export async function generateMetadata() {
 *   const content = await builderClient.fetchTextContent();
 *
 *   return generateMetadataFromContent(content, {
 *     defaultTitle: 'My Website',
 *     titleSuffix: ' | My Brand'
 *   });
 * }
 * ```
 */
declare function generateMetadataFromContent(content: BuilderPageContent[], options?: {
    defaultTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultDescription?: string;
}): {
    title: string;
    description: string;
    openGraph: {
        title: string;
        description: string;
    };
};

/**
 * Search interface to represent a search result
 */
interface SearchResult {
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
interface SearchOptions {
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
declare function searchBuilderContent(content: BuilderPageContent[], searchTerm: string, options?: SearchOptions): SearchResult[];

/**
 * Server-side utility to fetch and extract text content from Builder.io API
 * @file fetchBuilderTextContent.ts
 */
interface BuilderContent {
    [pageTitle: string]: string[];
}
/**
 * Fetches and processes content from Builder.io API
 * @param apiKey - Builder.io API key
 * @param locale - Locale for content (default: "Default")
 * @param defaultLocale - Default locale to fall back to (default: "Default")
 * @returns Promise containing content and error status
 */
declare function fetchBuilderTextContent(apiKey: string, locale?: string, defaultLocale?: string): Promise<{
    content: BuilderContent;
    error: string | null;
}>;

export { type BuilderPageContent, type BuilderPluginOptions, type ExtractBuilderContentOptions, type FetchBuilderContentOptions, type SearchOptions, type SearchResult, createBuilderClient, extractBuilderContent, fetchBuilderContent, fetchBuilderTextContent, generateMetadataFromContent, searchBuilderContent };
