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

// src/utils/extractBuilderContent.ts
var DEFAULT_TEXT_FIELDS = ["text", "title", "textContent", "description"];
function cleanText(text) {
  return String(text).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
function extractTextFieldsFromObject(obj, options) {
  const { locale, textFields } = options;
  let texts = [];
  if (typeof obj === "object" && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === "@type" && value === "@builder.io/core:LocalizedValue") {
        const localizedText = obj[locale] || obj["Default"];
        if (localizedText) {
          texts.push(cleanText(localizedText));
        }
      }
      if (textFields.includes(key) && typeof value === "string") {
        texts.push(cleanText(value));
      }
      if (typeof value === "object" && value !== null) {
        texts = texts.concat(extractTextFieldsFromObject(value, { locale, textFields }));
      }
    });
  }
  return texts;
}
function extractBuilderContent(builderResults, options = {}) {
  const {
    locale = "us-en",
    textFields = [],
    contentTransformer
  } = options;
  const allTextFields = [.../* @__PURE__ */ new Set([...DEFAULT_TEXT_FIELDS, ...textFields])];
  let formattedContent = {};
  builderResults.forEach((result) => {
    var _a, _b;
    const pageTitle = ((_a = result.data) == null ? void 0 : _a.title) || result.name || `Page-${result.id}`;
    const pageTexts = ((_b = result.data) == null ? void 0 : _b.blocks) ? extractTextFieldsFromObject(result.data.blocks, { locale, textFields: allTextFields }) : [];
    if (pageTexts.length > 0) {
      formattedContent[pageTitle] = pageTexts;
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
      locale = "us-en",
      apiUrl = "https://cdn.builder.io/api/v3/content",
      limit = 100,
      textFields = [],
      contentTransformer,
      model = "page",
      query = {},
      fetchImplementation,
      includeUrl = false
    } = options;
    if (!apiKey) {
      throw new Error("Builder API key is required");
    }
    let url = `${apiUrl}/${model}?apiKey=${apiKey}&limit=${limit}`;
    Object.entries(query).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
    });
    const fetchFn = fetchImplementation || fetch;
    const response = yield fetchFn(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = yield response.json();
    if (!data.results || data.results.length === 0) {
      console.warn("No results found.");
      return includeUrl ? { content: {}, urls: {} } : {};
    }
    const content = extractBuilderContent(data.results, {
      locale,
      textFields,
      contentTransformer
    });
    if (includeUrl) {
      const urls = {};
      data.results.forEach((result) => {
        var _a, _b, _c, _d;
        if (result.name && (((_a = result.data) == null ? void 0 : _a.url) || ((_b = result.data) == null ? void 0 : _b.path))) {
          urls[result.name] = ((_c = result.data) == null ? void 0 : _c.url) || ((_d = result.data) == null ? void 0 : _d.path);
        }
      });
      return {
        content,
        urls
      };
    }
    return content;
  });
}

// src/builder-integration.ts
function createBuilderClient(options) {
  const {
    apiKey,
    locale = "us-en",
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
     * @param {Omit<FetchBuilderContentOptions, 'apiKey' | 'locale' | 'apiUrl' | 'textFields' | 'fetchImplementation'>} [fetchOptions={}] - Additional fetch options
     * @returns {Promise<Record<string, string[]> | BuilderContentResponse>} Promise resolving to text content and optionally URLs
     */
    fetchTextContent: (..._0) => __async(this, [..._0], function* (fetchOptions = {}) {
      return fetchBuilderContent(apiKey, __spreadValues({
        locale,
        apiUrl,
        textFields,
        fetchImplementation
      }, fetchOptions));
    }),
    /**
     * Extract text from Builder.io content data
     * @param {any[]} builderResults - Raw Builder.io data
     * @param {Omit<ExtractBuilderContentOptions, 'locale' | 'textFields'>} [extractOptions] - Options for extraction
     * @returns {Record<string, string[]>} Formatted content
     */
    extractContent: (builderResults, extractOptions) => {
      return extractBuilderContent(builderResults, __spreadValues({
        locale,
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
  const titles = Object.keys(content);
  const firstPageTitle = titles.length > 0 ? titles[0] : defaultTitle;
  let description = defaultDescription;
  if (titles.length > 0 && content[titles[0]].length > 0) {
    description = content[titles[0]][0] || defaultDescription;
  }
  return {
    title: `${titlePrefix}${firstPageTitle}${titleSuffix}`,
    description
  };
}

// src/utils/searchBuilderContent.ts
function searchBuilderContent(contentInput, searchTerm, options = {}) {
  if (!searchTerm || searchTerm.trim() === "") {
    return [];
  }
  const contentToSearch = "content" in contentInput ? contentInput.content : contentInput;
  const {
    caseSensitive = false,
    wholeWord = false,
    minScore = 0.1,
    contextWords = 5
  } = options;
  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const results = [];
  const wholeWordRegex = wholeWord ? new RegExp(`\\b${escapeRegExp(normalizedSearchTerm)}\\b`, caseSensitive ? "g" : "gi") : null;
  Object.entries(contentToSearch).forEach(([pageTitle, texts]) => {
    if (!Array.isArray(texts)) {
      console.warn(`Expected texts for "${pageTitle}" to be an array, got ${typeof texts}`);
      return;
    }
    texts.forEach((text) => {
      const normalizedText = caseSensitive ? text : text.toLowerCase();
      let matchScore = 0;
      let matchFound = false;
      let matchPosition = -1;
      if (wholeWord && wholeWordRegex) {
        wholeWordRegex.lastIndex = 0;
        let match;
        while ((match = wholeWordRegex.exec(text)) !== null) {
          matchScore += 2;
          matchFound = true;
          matchPosition = match.index;
          const excerpt = generateExcerpt(text, match.index, match[0].length, contextWords);
          results.push({
            pageTitle,
            text,
            matchScore: calculateFinalScore(matchScore, text.length),
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
          const excerpt = generateExcerpt(text, position, normalizedSearchTerm.length, contextWords);
          results.push({
            pageTitle,
            text,
            matchScore: calculateFinalScore(matchScore, text.length),
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
  const words = text.split(/\s+/);
  const fullWordArray = [];
  let currentPosition = 0;
  words.forEach((word) => {
    const startPos = text.indexOf(word, currentPosition);
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
    return text.substring(
      Math.max(0, matchIndex - 50),
      Math.min(text.length, matchIndex + matchLength + 50)
    );
  }
  const startIndex = Math.max(0, matchWordIndex - contextWords);
  const endIndex = Math.min(fullWordArray.length, matchWordIndex + contextWords + 1);
  let excerpt = "";
  if (startIndex > 0) excerpt += "... ";
  excerpt += fullWordArray.slice(startIndex, endIndex).map((w) => w.word).join(" ");
  if (endIndex < fullWordArray.length) excerpt += " ...";
  return excerpt;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export {
  createBuilderClient,
  extractBuilderContent,
  fetchBuilderContent,
  generateMetadataFromContent,
  searchBuilderContent
};
