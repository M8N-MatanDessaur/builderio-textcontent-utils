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
interface FetchBuilderContentOptions {
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
declare function extractBuilderContent(builderResults: any[], options?: ExtractBuilderContentOptions): Record<string, string[]>;
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
declare function fetchBuilderContent(apiKey: string, options?: FetchBuilderContentOptions): Promise<Record<string, string[]>>;

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
     * Content locale (defaults to 'us-en' if not provided)
     * @default 'us-en'
     */
    locale?: string;
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
     * @param {Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'apiUrl' | 'textFields' | 'fetchImplementation'>} [fetchOptions={}] - Additional fetch options
     * @returns {Promise<Record<string, string[]>>} Promise resolving to text content
     */
    fetchTextContent: (fetchOptions?: Omit<FetchBuilderContentOptions, "apiKey" | "locale" | "apiUrl" | "textFields" | "fetchImplementation">) => Promise<Record<string, string[]>>;
    /**
     * Extract text from Builder.io content data
     * @param {any[]} builderResults - Raw Builder.io data
     * @param {Omit<ExtractBuilderContentOptions, 'locale' | 'textFields'>} [extractOptions] - Options for extraction
     * @returns {Record<string, string[]>} Formatted content
     */
    extractContent: (builderResults: any[], extractOptions?: Omit<ExtractBuilderContentOptions, "locale" | "textFields">) => Record<string, string[]>;
};
/**
 * Generate metadata from Builder.io content
 * Useful for Next.js metadata API
 *
 * @public
 * @param {Record<string, string[]>} content - Builder.io content
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
declare function generateMetadataFromContent(content: Record<string, string[]>, options?: {
    defaultTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultDescription?: string;
}): {
    title: string;
    description: string;
};

/**
 * Server-side utility to fetch and extract text content from Builder.io API
 * @file fetchBuilderTextContent.ts
 */
interface BuilderContent {
    [pageTitle: string]: string[];
}

/**
 * Search interface to represent a search result
 */
interface SearchResult {
    pageTitle: string;
    text: string;
    matchScore: number;
    excerpt: string;
    matchPosition: number;
}
/**
 * Search options to configure search behavior
 */
interface SearchOptions {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    minScore?: number;
    contextWords?: number;
}
/**
 * Search through Builder.io content for matching text
 * @param content - The Builder.io content to search through
 * @param searchTerm - The term to search for
 * @param options - Search configuration options
 * @returns Array of search results sorted by relevance
 */
declare function searchBuilderContent(content: BuilderContent, searchTerm: string, options?: SearchOptions): SearchResult[];

export { type BuilderContent, type BuilderPluginOptions, type ExtractBuilderContentOptions, type FetchBuilderContentOptions, type SearchOptions, type SearchResult, createBuilderClient, extractBuilderContent, fetchBuilderContent, generateMetadataFromContent, searchBuilderContent };
