import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
  "hr",
  "span",
];

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer nofollow" }
          : attribs,
      }),
    },
  });
}

export function isHtmlEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return text.length === 0;
}
