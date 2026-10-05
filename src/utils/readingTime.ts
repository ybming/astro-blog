/**
 * Calculates the estimated reading time for a given piece of text.
 * Strips markdown/MDX syntax before counting words for a more accurate result.
 * Counts Latin words (200 wpm) and CJK characters (400 cpm) separately.
 *
 * @param body - Raw markdown/MDX string content
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Formatted string like "约 3 分钟阅读" or "不到 1 分钟阅读"
 */
export function getReadingTime(body: string, wordsPerMinute = 200): string {
  // Strip frontmatter
  const withoutFrontmatter = body.replace(/^---[\s\S]*?---\n?/, "");

  // Strip common markdown/MDX syntax that isn't real words
  const plainText = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[.*?\]\(.*?\)/g, "$1") // links → keep link text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1") // bold/italic
    .replace(/^\s*[-*+>|]\s*/gm, "") // lists, blockquotes, tables
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();

  const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
  const cjkChars = (plainText.match(cjkPattern) ?? []).length;
  const latinWords = plainText
    .replace(cjkPattern, " ")
    .split(" ")
    .filter(Boolean).length;

  const minutes = Math.ceil(
    latinWords / wordsPerMinute + cjkChars / (wordsPerMinute * 2)
  );

  return minutes < 1 ? "不到 1 分钟阅读" : `约 ${minutes} 分钟阅读`;
}
