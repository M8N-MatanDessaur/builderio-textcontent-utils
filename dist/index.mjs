var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/utils/textCleaner.ts
var namedEntities = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "\xA9",
  reg: "\xAE",
  trade: "\u2122"
  // Add more common entities if needed
};
var decodeHtmlEntities = (text) => {
  return text.replace(
    /&(?:#([0-9]+)|#x([0-9a-fA-F]+)|([a-zA-Z0-9]+));/g,
    (match, dec, hex, name) => {
      if (dec) return String.fromCharCode(parseInt(dec, 10));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      if (name && namedEntities.hasOwnProperty(name)) return namedEntities[name];
      return match;
    }
  );
};
var cleanText = (text) => {
  if (!text) return "";
  let cleaned = String(text);
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  cleaned = decodeHtmlEntities(cleaned);
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*(.+?)\*/g, "$1");
  cleaned = cleaned.replace(/\_\_(.+?)\_\_/g, "$1");
  cleaned = cleaned.replace(/\_(.+?)\_/g, "$1");
  cleaned = cleaned.replace(/\~\~(.+?)\~\~/g, "$1");
  cleaned = cleaned.replace(/\`(.+?)\`/g, "$1");
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.trim();
  return cleaned;
};

// src/utils/extractBuilderContent.ts
var DEFAULT_TEXT_FIELDS = ["text", "title", "textContent", "description"];
function extractTextFieldsFromObject(obj, options) {
  const { locale, defaultLocale, textFields } = options;
  let texts = [];
  if (typeof obj === "object" && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === "@type" && value === "@builder.io/core:LocalizedValue") {
        const localizedText = obj[locale] || obj[defaultLocale] || obj["Default"];
        if (localizedText) {
          texts.push(cleanText(localizedText));
        }
      }
      if (textFields.includes(key) && typeof value === "string") {
        texts.push(cleanText(value));
      }
      if (typeof value === "object" && value !== null) {
        texts = texts.concat(extractTextFieldsFromObject(value, { locale, defaultLocale, textFields }));
      }
    });
  }
  return texts;
}
function extractBuilderContent(builderResults, options = {}) {
  const {
    locale = "Default",
    defaultLocale = "Default",
    textFields = [],
    contentTransformer
  } = options;
  const allTextFields = [.../* @__PURE__ */ new Set([...DEFAULT_TEXT_FIELDS, ...textFields])];
  let formattedContent = [];
  builderResults.forEach((result) => {
    var _a, _b, _c, _d;
    let pageTitle = "";
    const titleValue = (_a = result.data) == null ? void 0 : _a.title;
    if (titleValue && typeof titleValue === "object" && titleValue["@type"] === "@builder.io/core:LocalizedValue") {
      pageTitle = titleValue[locale] || titleValue[defaultLocale] || titleValue["Default"] || result.name || `Page-${result.id}`;
    } else {
      pageTitle = titleValue || result.name || `Page-${result.id}`;
    }
    const pageUrl = ((_b = result.data) == null ? void 0 : _b.url) || ((_c = result.data) == null ? void 0 : _c.path) || "#";
    const pageTexts = ((_d = result.data) == null ? void 0 : _d.blocks) ? extractTextFieldsFromObject(result.data.blocks, { locale, defaultLocale, textFields: allTextFields }) : [];
    if (pageTexts.length > 0) {
      formattedContent.push({
        title: pageTitle,
        url: pageUrl,
        content: pageTexts
      });
    }
  });
  if (typeof contentTransformer === "function") {
    formattedContent = contentTransformer(formattedContent, builderResults);
  }
  return formattedContent;
}
function fetchBuilderContent(_0) {
  return __async(this, arguments, function* (apiKey, options = {}) {
    const {
      locale = "Default",
      defaultLocale = "Default",
      apiUrl = "https://cdn.builder.io/api/v3/content",
      limit = 100,
      textFields = [],
      model = "page",
      query = {},
      contentTransformer,
      fetchImplementation = fetch
    } = options;
    if (!apiKey) {
      throw new Error("Builder.io API key is required");
    }
    try {
      let apiUrlWithParams = `${apiUrl}/${model}?apiKey=${encodeURIComponent(apiKey)}`;
      apiUrlWithParams += `&limit=${limit}`;
      apiUrlWithParams += `&cachebust=${Date.now()}`;
      Object.entries(query).forEach(([key, value]) => {
        apiUrlWithParams += `&${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      });
      const response = yield fetchImplementation(apiUrlWithParams);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = yield response.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }
      return extractBuilderContent(data.results, {
        locale,
        defaultLocale,
        textFields,
        contentTransformer
      });
    } catch (error) {
      console.error("Error fetching Builder.io content:", error);
      throw new Error(`Failed to fetch content: ${error.message}`);
    }
  });
}

// src/builder-integration.ts
function createBuilderClient(options) {
  const {
    apiKey,
    locale = "Default",
    defaultLocale = "Default",
    apiUrl,
    textFields = [],
    fetchImplementation
  } = options;
  if (!apiKey) {
    throw new Error("Builder.io API key is required");
  }
  return {
    /**
     * Fetch text content from Builder.io
     * @param {Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'defaultLocale' | 'apiUrl' | 'textFields' | 'fetchImplementation'>} [fetchOptions={}] - Additional fetch options
     * @returns {Promise<BuilderPageContent[]>} Promise resolving to text content
     */
    fetchTextContent: (..._0) => __async(this, [..._0], function* (fetchOptions = {}) {
      return fetchBuilderContent(apiKey, __spreadValues({
        locale,
        defaultLocale,
        apiUrl,
        textFields,
        fetchImplementation
      }, fetchOptions));
    }),
    /**
     * Extract text from Builder.io content data
     * @param {any[]} builderResults - Raw Builder.io data
     * @param {Omit<ExtractBuilderContentOptions, 'locale' | 'defaultLocale' | 'textFields'>} [extractOptions] - Options for extraction
     * @returns {BuilderPageContent[]} Formatted content
     */
    extractContent: (builderResults, extractOptions) => {
      return extractBuilderContent(builderResults, __spreadValues({
        locale,
        defaultLocale,
        textFields
      }, extractOptions));
    }
  };
}
function generateMetadataFromContent(content, options = {}) {
  const {
    defaultTitle = "Home",
    titlePrefix = "",
    titleSuffix = "",
    defaultDescription = ""
  } = options;
  const firstPage = content.length > 0 ? content[0] : null;
  const pageTitle = firstPage ? firstPage.title : defaultTitle;
  let description = defaultDescription;
  if (firstPage && firstPage.content.length > 0) {
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

// src/utils/searchBuilderContent.ts
function searchBuilderContent(content, searchTerm, options = {}) {
  if (!searchTerm || searchTerm.trim() === "") {
    return [];
  }
  const cleanedSearchTerm = cleanText(searchTerm);
  const {
    caseSensitive = false,
    wholeWord = false,
    minScore = 0.1,
    contextWords = 5
  } = options;
  const normalizedSearchTerm = caseSensitive ? cleanedSearchTerm : cleanedSearchTerm.toLowerCase();
  const results = [];
  const wholeWordRegex = wholeWord ? new RegExp(`\\b${escapeRegExp(normalizedSearchTerm)}\\b`, caseSensitive ? "g" : "gi") : null;
  content.forEach((page) => {
    if (!Array.isArray(page.content)) {
      console.warn(`Expected content for "${page.title}" to be an array, got ${typeof page.content}`);
      return;
    }
    page.content.forEach((text) => {
      const cleanedText = cleanText(text);
      const normalizedText = caseSensitive ? cleanedText : cleanedText.toLowerCase();
      let matchScore = 0;
      let matchFound = false;
      let matchPosition = -1;
      if (wholeWord && wholeWordRegex) {
        wholeWordRegex.lastIndex = 0;
        let match;
        while ((match = wholeWordRegex.exec(cleanedText)) !== null) {
          matchScore += 2;
          matchFound = true;
          matchPosition = match.index;
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
      if (!wholeWord) {
        let position = normalizedText.indexOf(normalizedSearchTerm);
        while (position !== -1) {
          matchScore += 1;
          matchFound = true;
          matchPosition = position;
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
  const filteredResults = results.filter((result) => result.matchScore >= minScore);
  return filteredResults.sort((a, b) => b.matchScore - a.matchScore);
}
function calculateFinalScore(baseScore, textLength) {
  return baseScore * (50 / Math.max(textLength, 50));
}
function generateExcerpt(text, matchIndex, matchLength, contextWords) {
  const cleanedText = cleanText(text);
  const words = cleanedText.split(/\s+/);
  const fullWordArray = [];
  let currentPosition = 0;
  words.forEach((word) => {
    const startPos = cleanedText.indexOf(word, currentPosition);
    const endPos = startPos + word.length;
    const wordOverlapsMatch = startPos <= matchIndex + matchLength - 1 && endPos > matchIndex;
    fullWordArray.push({
      word,
      isMatch: wordOverlapsMatch
    });
    currentPosition = endPos;
  });
  const matchWordIndex = fullWordArray.findIndex((w) => w.isMatch);
  if (matchWordIndex === -1) {
    return cleanedText.substring(
      Math.max(0, matchIndex - 50),
      Math.min(cleanedText.length, matchIndex + matchLength + 50)
    );
  }
  const startIndex = Math.max(0, matchWordIndex - contextWords);
  const endIndex = Math.min(fullWordArray.length, matchWordIndex + contextWords + 1);
  let excerpt = "";
  if (startIndex > 0) excerpt += "... ";
  excerpt += fullWordArray.slice(startIndex, endIndex).map((item) => item.word).join(" ");
  if (endIndex < fullWordArray.length) excerpt += " ...";
  return excerpt;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/utils/fetchBuilderTextContent.ts
function fetchBuilderTextContent(apiKey, locale = "Default", defaultLocale = "Default") {
  return __async(this, null, function* () {
    if (!apiKey) {
      console.error("Builder.io API key is required.");
      return { content: {}, error: "Builder.io API key is required." };
    }
    const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}&limit=100&fields=data.title,data.blocks`;
    try {
      const response = yield fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const errorText = yield response.text();
        console.error(`Error fetching content: ${response.status} ${response.statusText}`, errorText);
        return { content: {}, error: `Failed to fetch content: ${response.status} ${response.statusText}` };
      }
      const data = yield response.json();
      if (!data.results || data.results.length === 0) {
        console.warn("No results found from Builder.io API.");
        return { content: {}, error: null };
      }
      const extractTextFields = (obj) => {
        let texts = [];
        if (typeof obj === "object" && obj !== null) {
          if (obj["@type"] === "@builder.io/core:LocalizedValue") {
            const localizedText = obj[locale] || obj[defaultLocale] || obj["Default"];
            if (localizedText && typeof localizedText === "string") {
              const cleaned = cleanText(localizedText);
              if (cleaned) texts.push(cleaned);
            }
            return texts;
          }
          Object.entries(obj).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (["text", "title", "heading", "subheading", "description", "caption", "label", "buttontext", "alttext", "name", "content", "plaintext", "summary", "testimonial", "blockquote"].includes(lowerKey) && typeof value === "string" && value.trim()) {
              const cleaned = cleanText(value);
              if (cleaned) texts.push(cleaned);
            } else if (typeof value === "object" && value !== null) {
              texts = texts.concat(extractTextFields(value));
            } else if (Array.isArray(value)) {
              value.forEach((item) => {
                if (typeof item === "string" && item.trim()) {
                  const cleaned = cleanText(item);
                  if (cleaned) texts.push(cleaned);
                } else if (typeof item === "object" && item !== null) {
                  texts = texts.concat(extractTextFields(item));
                }
              });
            }
          });
        } else if (typeof obj === "string" && obj.trim()) {
          const cleaned = cleanText(obj);
          if (cleaned) texts.push(cleaned);
        }
        return [...new Set(texts)].filter(Boolean);
      };
      let formattedContent = {};
      data.results.forEach((result, index) => {
        var _a, _b;
        const rawTitle = (_a = result.data) == null ? void 0 : _a.title;
        let cleanedTitle = "";
        if (rawTitle && typeof rawTitle === "object" && rawTitle["@type"] === "@builder.io/core:LocalizedValue") {
          const localizedTitle = rawTitle[locale] || rawTitle[defaultLocale] || rawTitle["Default"];
          cleanedTitle = localizedTitle ? cleanText(localizedTitle) : "";
        } else {
          cleanedTitle = rawTitle ? cleanText(rawTitle) : "";
        }
        const pageTitle = cleanedTitle || `Untitled Page ${index + 1}`;
        const pageTexts = ((_b = result.data) == null ? void 0 : _b.blocks) ? extractTextFields(result.data.blocks) : [];
        if (cleanedTitle && !pageTexts.includes(cleanedTitle)) {
          pageTexts.unshift(cleanedTitle);
        }
        if (pageTexts.length > 0) {
          if (formattedContent[pageTitle]) {
            const existingTexts = new Set(formattedContent[pageTitle]);
            pageTexts.forEach((text) => existingTexts.add(text));
            formattedContent[pageTitle] = Array.from(existingTexts);
          } else {
            formattedContent[pageTitle] = pageTexts;
          }
        }
      });
      return { content: formattedContent, error: null };
    } catch (err) {
      console.error("Error processing Builder.io content:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { content: {}, error: `Error processing content: ${errorMessage}` };
    }
  });
}
export {
  createBuilderClient,
  extractBuilderContent,
  fetchBuilderContent,
  fetchBuilderTextContent,
  generateMetadataFromContent,
  searchBuilderContent
};
