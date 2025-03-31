/**
 * @file Builder.io server-side integration utilities
 * @module @builder-io/content-utils/builder-integration
 * @description Server-side helpers and integration utilities for Builder.io content
 */

import { extractBuilderContent, fetchBuilderContent, BuilderPageContent } from './utils/extractBuilderContent';
import type { ExtractBuilderContentOptions, FetchBuilderContentOptions } from './utils/extractBuilderContent';

/**
 * Options for the Builder.io content client
 * @typedef {Object} BuilderPluginOptions
 */
export interface BuilderPluginOptions {
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
export function createBuilderClient(options: BuilderPluginOptions) {
  const {
    apiKey,
    locale = 'Default',
    defaultLocale = 'Default',
    apiUrl,
    textFields = [],
    fetchImplementation
  } = options;
  
  // Validate API key
  if (!apiKey) {
    throw new Error('Builder.io API key is required');
  }
  
  // Create client instance
  return {
    /**
     * Fetch text content from Builder.io
     * @param {Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'defaultLocale' | 'apiUrl' | 'textFields' | 'fetchImplementation'>} [fetchOptions={}] - Additional fetch options
     * @returns {Promise<BuilderPageContent[]>} Promise resolving to text content
     */
    fetchTextContent: async (fetchOptions: Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'defaultLocale' | 'apiUrl' | 'textFields' | 'fetchImplementation'> = {}) => {
      return fetchBuilderContent(apiKey, {
        locale,
        defaultLocale,
        apiUrl,
        textFields,
        fetchImplementation,
        ...fetchOptions
      });
    },
    
    /**
     * Extract text from Builder.io content data
     * @param {any[]} builderResults - Raw Builder.io data
     * @param {Omit<ExtractBuilderContentOptions, 'locale' | 'defaultLocale' | 'textFields'>} [extractOptions] - Options for extraction
     * @returns {BuilderPageContent[]} Formatted content
     */
    extractContent: (builderResults: any[], extractOptions?: Omit<ExtractBuilderContentOptions, 'locale' | 'defaultLocale' | 'textFields'>) => {
      return extractBuilderContent(builderResults, {
        locale,
        defaultLocale,
        textFields,
        ...extractOptions
      });
    }
  };
}

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
export function generateMetadataFromContent(
  content: BuilderPageContent[],
  options: {
    defaultTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultDescription?: string;
  } = {}
) {
  const {
    defaultTitle = 'Home',
    titlePrefix = '',
    titleSuffix = '',
    defaultDescription = ''
  } = options;
  
  // Get the first page title
  const firstPage = content.length > 0 ? content[0] : null;
  const pageTitle = firstPage ? firstPage.title : defaultTitle;
  
  // Get the first page description (if available)
  let description = defaultDescription;
  if (firstPage && firstPage.content.length > 0) {
    // Use the first extracted text as description
    description = firstPage.content[0] || defaultDescription;
  }
  
  return {
    title: `${titlePrefix}${pageTitle}${titleSuffix}`,
    description,
    openGraph: {
      title: `${titlePrefix}${pageTitle}${titleSuffix}`,
      description
    }
  };
}
