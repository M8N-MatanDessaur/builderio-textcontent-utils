"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createBuilderClient: () => createBuilderClient,
  extractBuilderContent: () => extractBuilderContent,
  fetchBuilderContent: () => fetchBuilderContent,
  fetchBuilderTextContent: () => fetchBuilderTextContent,
  generateMetadataFromContent: () => generateMetadataFromContent,
  searchBuilderContent: () => searchBuilderContent
});
module.exports = __toCommonJS(index_exports);

// src/utils/extractBuilderContent.ts
var DEFAULT_TEXT_FIELDS = ["text", "title", "textContent", "description"];
function cleanText(text) {
  if (!text) return "";
  return String(text).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)).replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\_\_(.+?)\_\_/g, "$1").replace(/\_(.+?)\_/g, "$1").replace(/\~\~(.+?)\~\~/g, "$1").replace(/\`(.+?)\`/g, "$1").replace(/\s+/g, " ").trim();
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
  let formattedContent = [];
  builderResults.forEach((result) => {
    var _a, _b, _c, _d;
    const pageTitle = ((_a = result.data) == null ? void 0 : _a.title) || result.name || `Page-${result.id}`;
    const pageUrl = ((_b = result.data) == null ? void 0 : _b.url) || ((_c = result.data) == null ? void 0 : _c.path) || "#";
    const pageTexts = ((_d = result.data) == null ? void 0 : _d.blocks) ? extractTextFieldsFromObject(result.data.blocks, { locale, textFields: allTextFields }) : [];
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
      locale = "us-en",
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
     * @returns {Promise<BuilderPageContent[]>} Promise resolving to text content
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
     * @returns {BuilderPageContent[]} Formatted content
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
  const {
    caseSensitive = false,
    wholeWord = false,
    minScore = 0.1,
    contextWords = 5
  } = options;
  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const results = [];
  const wholeWordRegex = wholeWord ? new RegExp(`\\b${escapeRegExp(normalizedSearchTerm)}\\b`, caseSensitive ? "g" : "gi") : null;
  content.forEach((page) => {
    if (!Array.isArray(page.content)) {
      console.warn(`Expected content for "${page.title}" to be an array, got ${typeof page.content}`);
      return;
    }
    page.content.forEach((text) => {
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
            pageTitle: page.title,
            pageUrl: page.url,
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
            pageTitle: page.title,
            pageUrl: page.url,
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
  excerpt += fullWordArray.slice(startIndex, endIndex).map((item) => item.isMatch ? `**${item.word}**` : item.word).join(" ");
  if (endIndex < fullWordArray.length) excerpt += " ...";
  return excerpt;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/utils/fetchBuilderTextContent.ts
function fetchBuilderTextContent(apiKey, locale = "us-en") {
  return __async(this, null, function* () {
    const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}`;
    try {
      const response = yield fetch(url, { cache: "no-store" });
      const data = yield response.json();
      if (!data.results || data.results.length === 0) {
        console.warn("No results found.");
        return { content: [], error: null };
      }
      const cleanText2 = (text) => {
        if (!text) return "";
        return String(text).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)).replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\_\_(.+?)\_\_/g, "$1").replace(/\_(.+?)\_/g, "$1").replace(/\~\~(.+?)\~\~/g, "$1").replace(/\`(.+?)\`/g, "$1").replace(/\s+/g, " ").trim();
      };
      const extractTextFields = (obj) => {
        let texts = [];
        if (typeof obj === "object" && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            if (key === "@type" && value === "@builder.io/core:LocalizedValue") {
              const localizedText = obj[locale] || obj["Default"];
              if (localizedText) {
                texts.push(cleanText2(localizedText));
              }
            }
            if (["text", "title", "textContent", "description"].includes(key) && typeof value === "string") {
              texts.push(cleanText2(value));
            }
            if (typeof value === "object" && value !== null) {
              texts = texts.concat(extractTextFields(value));
            }
          });
        }
        return texts;
      };
      let formattedContent = [];
      data.results.forEach((result) => {
        var _a, _b, _c, _d;
        const pageTitle = ((_a = result.data) == null ? void 0 : _a.title) || result.name || "Untitled";
        const pageUrl = ((_b = result.data) == null ? void 0 : _b.url) || ((_c = result.data) == null ? void 0 : _c.path) || "#";
        const pageTexts = ((_d = result.data) == null ? void 0 : _d.blocks) ? extractTextFields(result.data.blocks) : [];
        if (pageTexts.length > 0) {
          formattedContent.push({
            title: pageTitle,
            url: pageUrl,
            content: pageTexts
          });
        }
      });
      return { content: formattedContent, error: null };
    } catch (err) {
      console.error("Error fetching content:", err);
      return { content: [], error: err.message };
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createBuilderClient,
  extractBuilderContent,
  fetchBuilderContent,
  fetchBuilderTextContent,
  generateMetadataFromContent,
  searchBuilderContent
});
