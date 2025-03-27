/**
 * @file Main entry point for Builder.io content utilities
 * @module builderio-textcontent-utils
 * @description Server-side utilities for fetching and processing content from Builder.io
 */

/**
 * Core content extraction utilities
 * 
 * @example
 * ```typescript
 * import { fetchBuilderContent } from 'builderio-textcontent-utils';
 * 
 * // In a Next.js API route
 * export async function GET() {
 *   const content = await fetchBuilderContent('YOUR_API_KEY', {
 *     model: 'page',
 *     locale: 'en-US'
 *   });
 *   
 *   // Content now includes title, url, and text content for each page
 *   return Response.json(content);
 * }
 * ```
 */
export { extractBuilderContent, fetchBuilderContent } from './utils/extractBuilderContent';
export type { ExtractBuilderContentOptions, FetchBuilderContentOptions, BuilderPageContent } from './utils/extractBuilderContent';

/**
 * Integration helpers for Builder.io
 * 
 * @example
 * ```typescript
 * import { createBuilderClient, generateMetadataFromContent } from 'builderio-textcontent-utils';
 * 
 * const builderClient = createBuilderClient({
 *   apiKey: process.env.BUILDER_API_KEY || '',
 *   locale: 'en-US'
 * });
 * 
 * // Generate metadata for Next.js
 * export async function generateMetadata() {
 *   const content = await builderClient.fetchTextContent();
 *   return generateMetadataFromContent(content);
 * }
 * ```
 */
export { createBuilderClient, generateMetadataFromContent } from './builder-integration';
export type { BuilderPluginOptions } from './builder-integration';

/**
 * Search utilities for Builder.io content
 * 
 * @example
 * ```typescript
 * import { searchBuilderContent } from 'builderio-textcontent-utils';
 * 
 * // Get content from Builder.io
 * const content = await fetchBuilderContent('YOUR_API_KEY');
 * 
 * // Search through the content (results include URLs automatically)
 * const results = searchBuilderContent(content, 'search term', {
 *   caseSensitive: false,
 *   wholeWord: true,
 *   contextWords: 5
 * });
 * ```
 */
export { searchBuilderContent } from './utils/searchBuilderContent';
export type { SearchResult, SearchOptions } from './utils/searchBuilderContent';

/**
 * Direct fetch utility
 * 
 * @example
 * ```typescript
 * import { fetchBuilderTextContent } from 'builderio-textcontent-utils';
 * 
 * // Fetch content with simplified API
 * const { content, error } = await fetchBuilderTextContent('YOUR_API_KEY', 'en-US');
 * ```
 */
export { fetchBuilderTextContent } from './utils/fetchBuilderTextContent';
