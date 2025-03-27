/**
 * @file Main entry point for Builder.io content utilities
 * @module @builder-io/content-utils
 * @description Server-side utilities for fetching and processing content from Builder.io
 */

/**
 * Core content extraction utilities
 * 
 * @example
 * ```typescript
 * import { fetchBuilderContent } from '@builder-io/content-utils';
 * 
 * // In a Next.js API route
 * export async function GET() {
 *   const content = await fetchBuilderContent('YOUR_API_KEY', {
 *     model: 'page',
 *     locale: 'en-US'
 *   });
 *   
 *   return Response.json(content);
 * }
 * ```
 */
export { extractBuilderContent, fetchBuilderContent } from './utils/extractBuilderContent';
export type { ExtractBuilderContentOptions, FetchBuilderContentOptions } from './utils/extractBuilderContent';

/**
 * Integration helpers for Builder.io
 * 
 * @example
 * ```typescript
 * import { createBuilderClient, generateMetadataFromContent } from '@builder-io/content-utils';
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
 * import { searchBuilderContent } from '@builder-io/content-utils';
 * 
 * // Get content from Builder.io
 * const content = await fetchBuilderContent('YOUR_API_KEY');
 * 
 * // Search through the content
 * const results = searchBuilderContent(content, 'search term', {
 *   caseSensitive: false,
 *   wholeWord: true,
 *   contextWords: 5
 * });
 * ```
 */
export { searchBuilderContent } from './utils/searchBuilderContent';
export type { SearchResult, SearchOptions } from './utils/searchBuilderContent';
export type { BuilderContent } from './utils/fetchBuilderTextContent';
