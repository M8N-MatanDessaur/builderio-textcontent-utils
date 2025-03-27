# Builder.io Content Utils

A server-side utility package for fetching and processing content from Builder.io, designed for Next.js projects.

## Installation

```bash
npm install builderio-textcontent-utils
# or
yarn add builderio-textcontent-utils
# or
pnpm add builderio-textcontent-utils
```

## Features

- Server-side content fetching from Builder.io 
- Flexible text extraction from Builder.io content
- Support for localized content
- Custom content transformation capabilities
- TypeScript support
- Next.js metadata API integration
- Search functionality for content (ex for search pages)
- Page URL retrieval for linking to content (added in v0.2.0)

## Setup

Add your Builder.io API key to your environment variables:

```
NEXT_PUBLIC_BUILDER_API_KEY=your_builder_api_key_here
```

## Usage Examples

### Server Components or API Routes

```typescript
import { fetchBuilderContent } from 'builderio-textcontent-utils';

// In a Next.js server component or API route
export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || '';
  
  // Fetch content with URLs included (added in v0.2.0)
  const result = await fetchBuilderContent(apiKey, {
    locale: 'en-US',
    model: 'page',
    limit: 20,
    includeUrl: true // Add this to get URLs
  });
  
  // Access content and URLs
  const content = 'content' in result ? result.content : result;
  const urls = 'urls' in result ? result.urls : {};
  
  return Response.json({ content, urls });
}
```

### With Builder Client

```typescript
import { createBuilderClient, generateMetadataFromContent } from 'builderio-textcontent-utils';

// Create a reusable client
const builderClient = createBuilderClient({
  apiKey: process.env.NEXT_PUBLIC_BUILDER_API_KEY || '',
  locale: 'en-US'
});

// In a Next.js app
export async function generateMetadata() {
  const content = await builderClient.fetchTextContent({
    model: 'page',
    query: { 'data.slug': 'home' }
  });
  
  // Generate metadata for Next.js
  return generateMetadataFromContent(content, {
    defaultTitle: 'My Website',
    titleSuffix: ' | My Brand'
  });
}

// Fetch content with page URLs (added in v0.2.0)
export async function fetchContentWithUrls() {
  const result = await builderClient.fetchTextContent({
    model: 'page',
    includeUrl: true // Add this to get URLs
  });
  
  // With includeUrl: true, result will have this structure:
  // {
  //   content: { "Page Title": ["text content", "more content"] },
  //   urls: { "Page Title": "/page-url" }
  // }
  return result;
}
```

### Searching Content

```typescript
import { fetchBuilderContent, searchBuilderContent } from 'builderio-textcontent-utils';

// In a Next.js API route for search with URLs (added in v0.2.0)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  // Get content and URLs from Builder.io
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || '';
  const result = await fetchBuilderContent(apiKey, { includeUrl: true });
  
  // With includeUrl: true, we get { content, urls }
  const content = 'content' in result ? result.content : result;
  const urls = 'urls' in result ? result.urls : {};
  
  // Search through the content
  const searchResults = searchBuilderContent(content, query, {
    caseSensitive: false,
    wholeWord: false,
    contextWords: 5
  });
  
  // Add URLs to search results
  const resultsWithUrls = searchResults.map(result => ({
    ...result,
    url: urls[result.page] || '#'
  }));
  
  return Response.json({ results: resultsWithUrls });
}
```

### Custom Content Processing

```typescript
import { extractBuilderContent } from 'builderio-textcontent-utils';

// Extract content from raw Builder.io data
function processBuilderData(builderData) {
  const content = extractBuilderContent(builderData, {
    locale: 'en-US',
    textFields: ['subtitle', 'buttonText', 'altText'],
    contentTransformer: (content, rawResults) => {
      // Custom transformation logic
      return content;
    }
  });
  
  return content;
}
```

## API Reference

### fetchBuilderContent

```typescript
async function fetchBuilderContent(
  apiKey: string,
  options?: {
    locale?: string;
    apiUrl?: string;
    limit?: number;
    textFields?: string[];
    model?: string;
    query?: Record<string, any>;
    contentTransformer?: (content: Record<string, string[]>, rawResults: any[]) => Record<string, string[]>;
    fetchImplementation?: typeof fetch;
    includeUrl?: boolean; // Added in v0.2.0
  }
): Promise<BuilderContentResponse | Record<string, string[]>>;

// New in v0.2.0
interface BuilderContentResponse {
  content: Record<string, string[]>;
  urls?: Record<string, string>;
}
```

### fetchBuilderTextContent

```typescript
// Added in v0.2.0
async function fetchBuilderTextContent(
  apiKey: string,
  locale?: string
): Promise<{
  content: Record<string, string[]>;
  urls?: Record<string, string>;
  error: string | null;
}>;
```

### extractBuilderContent

```typescript
function extractBuilderContent(
  builderResults: any[],
  options?: {
    locale?: string;
    textFields?: string[];
    contentTransformer?: (content: Record<string, string[]>, rawResults: any[]) => Record<string, string[]>;
  }
): Record<string, string[]>;
```

### createBuilderClient

```typescript
function createBuilderClient(options: {
  apiKey: string;
  locale?: string;
  apiUrl?: string;
  textFields?: string[];
  fetchImplementation?: typeof fetch;
}): {
  fetchTextContent: (options?: object) => Promise<BuilderContentResponse | Record<string, string[]>>; // Return type updated in v0.2.0
  extractContent: (builderResults: any[], options?: object) => Record<string, string[]>;
};
```

### generateMetadataFromContent

```typescript
function generateMetadataFromContent(
  content: Record<string, string[]>,
  options?: {
    defaultTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultDescription?: string;
  }
): {
  title: string;
  description: string;
};
```

### searchBuilderContent

```typescript
function searchBuilderContent(
  content: BuilderContent,
  searchTerm: string,
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    minScore?: number;
    contextWords?: number;
  }
): SearchResult[];
```

## License

MIT

## Changelog

### v0.2.1
- Fixed searchBuilderContent to work with the new URL format
- Added type safety improvements for better compatibility between different response formats

### v0.2.0
- Added page URL retrieval functionality with `includeUrl` option
- Updated return types to support content and URLs in the same response
- Enhanced fetchBuilderTextContent to include URLs in response

### v0.1.0
- Initial release

---

This package is designed to work seamlessly with Next.js server components, API routes, and the metadata API. It makes content extraction from Builder.io more efficient for server-rendered applications