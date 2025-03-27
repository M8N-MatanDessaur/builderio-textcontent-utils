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
  const content = await fetchBuilderContent(apiKey, {
    locale: 'en-US',
    model: 'page',
    limit: 20
  });
  
  return Response.json({ content });
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
```

### Searching Content

```typescript
import { fetchBuilderContent, searchBuilderContent } from 'builderio-textcontent-utils';

// In a Next.js API route for search
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  // Get content from Builder.io
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || '';
  const content = await fetchBuilderContent(apiKey);
  
  // Search through the content
  const results = searchBuilderContent(content, query, {
    caseSensitive: false,
    wholeWord: false,
    contextWords: 5
  });
  
  return Response.json({ results });
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
  }
): Promise<Record<string, string[]>>;
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
  fetchTextContent: (options?: object) => Promise<Record<string, string[]>>;
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

interface SearchResult {
  pageTitle: string;
  text: string;
  matchScore: number;
  excerpt: string;
  matchPosition: number;
}
```

## Next.js Integration

This package is designed to work seamlessly with Next.js server components, API routes, and the metadata API. It makes content extraction from Builder.io more efficient for server-rendered applications.

## CSS Breakpoint Standards

When using this package with Builder.io projects, we recommend these standardized breakpoints to ensure consistency:

- **Desktop**: 1221px and up
- **Tablet**: 765px to 1220px
- **Mobile**: 764px and below

This aligns with Builder.io's breakpoint specifications and improves maintainability across projects.

## License

MIT
