/**
 * Custom hook to convert HTML content to plain text
 * This is useful for automatically generating plain text versions of HTML newsletters
 */

export function useHtmlToPlainText() {
  /**
   * Convert HTML string to plain text
   * @param html - HTML content to convert
   * @returns Plain text version of the HTML content
   */
  const htmlToPlainText = (html: string): string => {
    // Create a temporary DOM element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Handle paragraphs and breaks
    const handleParagraphs = (element: HTMLElement): string => {
      let result = "";

      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = (node as HTMLElement).tagName.toLowerCase();

          // Add appropriate spacing and formatting for different elements
          if (tagName === "p") {
            result += handleParagraphs(node as HTMLElement) + "\n\n";
          } else if (tagName === "br") {
            result += "\n";
          } else if (
            tagName === "h1" ||
            tagName === "h2" ||
            tagName === "h3" ||
            tagName === "h4" ||
            tagName === "h5" ||
            tagName === "h6"
          ) {
            result +=
              handleParagraphs(node as HTMLElement).toUpperCase() + "\n\n";
          } else if (tagName === "a") {
            const href = (node as HTMLAnchorElement).getAttribute("href");
            result += handleParagraphs(node as HTMLElement);
            if (href) {
              result += ` (${href})`;
            }
          } else if (tagName === "ul" || tagName === "ol") {
            result += "\n";
            const listItems = (node as HTMLElement).querySelectorAll("li");
            listItems.forEach((item, index) => {
              result += `${tagName === "ul" ? "- " : `${index + 1}. `}${
                item.textContent
              }\n`;
            });
            result += "\n";
          } else if (tagName === "blockquote") {
            result += "\n";
            const lines = handleParagraphs(node as HTMLElement).split("\n");
            lines.forEach((line) => {
              if (line.trim()) {
                result += `> ${line}\n`;
              }
            });
            result += "\n";
          } else if (tagName === "hr") {
            result += "\n-----------------------------------------\n\n";
          } else if (tagName === "img") {
            const alt =
              (node as HTMLImageElement).getAttribute("alt") || "image";
            result += `[${alt}]`;
          } else {
            result += handleParagraphs(node as HTMLElement);
          }
        }
      }

      return result;
    };

    let plainText = handleParagraphs(tempDiv);

    // Clean up multiple line breaks
    plainText = plainText.replace(/\n{3,}/g, "\n\n");

    return plainText.trim();
  };

  return { htmlToPlainText };
}
