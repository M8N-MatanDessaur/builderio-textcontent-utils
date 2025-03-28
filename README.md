# Builder.io Content Utils

A server-side utility package for fetching and processing content from Builder.io, designed for Next.js projects.

## What's New in v1.1.1

- **Enhanced Text Cleaning**: All extracted text is now consistently cleaned from rich text formatting and HTML entities
- **Improved Content Quality**: Text like `**Bold** Text with&nbsp;_formatting_` is now properly converted to plain text
- **Consistent Processing**: Unified text cleaning implementation across all utilities
- **Better Search Results**: Search functionality now works properly with formatted content
- **Plain Text Excerpts**: Search result excerpts now contain only plain text without any styling

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
- Page URLs automatically included in content structure
- **Enhanced text cleaning** that properly handles:
  - HTML tags removal
  - HTML named entities (e.g., `&amp;`, `&lt;`, `&nbsp;`)
  - HTML numeric entities (e.g., `&#160;`, `&#x00A0;`)
  - Rich text formatting markers (bold, italic, underline)
  - Whitespace normalization

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
  
  // Fetch content (URLs automatically included)
  const content = await fetchBuilderContent(apiKey, {
    locale: 'en-US',
    model: 'page',
    limit: 20
  });
  
  // Content is now an array of pages, each with title, url, and content
  // All text is properly cleaned from HTML and rich text formatting
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

// Fetch content (URLs are automatically included)
export async function fetchAllPages() {
  const content = await builderClient.fetchTextContent({
    model: 'page'
  });
  
  // Each item in the content array has:
  // { title: string, url: string, content: string[] }
  return content;
}
```

### Searching Content

```typescript
import { fetchBuilderContent, searchBuilderContent } from 'builderio-textcontent-utils';

// In a Next.js API route for search
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || '';
  
  // Fetch all content first
  const content = await fetchBuilderContent(apiKey, {
    locale: 'en-US',
    model: 'page'
  });
  
  // If query exists, perform search
  if (query) {
    // With v1.1.0, search now works properly with rich text and HTML entities
    // For example, searching for "Installation" will find "**One-Day** &nbsp;_Installation_"
    const results = searchBuilderContent(content, query, {
      caseSensitive: false,
      contextWords: 8
    });
    
    return Response.json({ results });
  }
  
  return Response.json({ content });
}
```

## API Reference

### Data Structures

```typescript
// Page content structure returned by all functions
interface BuilderPageContent {
  title: string;    // The page title
  url: string;      // The page URL
  content: string[]; // Array of extracted text content
}
```

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
    contentTransformer?: (content: BuilderPageContent[], rawResults: any[]) => BuilderPageContent[];
    fetchImplementation?: typeof fetch;
  }
): Promise<BuilderPageContent[]>;
```

### extractBuilderContent

```typescript
function extractBuilderContent(
  builderResults: any[],
  options?: {
    locale?: string;
    textFields?: string[];
    contentTransformer?: (content: BuilderPageContent[], rawResults: any[]) => BuilderPageContent[];
  }
): BuilderPageContent[];
```

### searchBuilderContent

```typescript
interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  minScore?: number;
  contextWords?: number;
}

interface SearchResult {
  pageTitle: string;
  pageUrl: string;
  text: string;
  matchScore: number;
  excerpt: string;
  matchPosition: number;
}

function searchBuilderContent(
  content: BuilderPageContent[],
  searchTerm: string,
  options?: SearchOptions
): SearchResult[];
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
  fetchTextContent: (fetchOptions?: object) => Promise<BuilderPageContent[]>;
  extractContent: (builderResults: any[], extractOptions?: object) => BuilderPageContent[];
};
```

### generateMetadataFromContent

```typescript
function generateMetadataFromContent(
  content: BuilderPageContent[],
  options?: {
    defaultTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultDescription?: string;
  }
): {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
  }
};
```

## Changes in v0.3.0

- Unified content structure: URLs are now automatically included with each page
- Improved content organization with a cleaner, more intuitive API
- Enhanced search results that include page URLs by default
- Better TypeScript types and documentation
- Optimized for Next.js applications