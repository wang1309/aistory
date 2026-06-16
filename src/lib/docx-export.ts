import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

type ExportOptions = {
  title: string;
  html: string;
};

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1") {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: el.textContent || "", bold: true })],
        })
      );
    } else if (tag === "h2") {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: el.textContent || "", bold: true })],
        })
      );
    } else if (tag === "h3") {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: el.textContent || "", bold: true })],
        })
      );
    } else if (tag === "p") {
      const runs = inlineToRuns(el);
      const align = el.style.textAlign;
      paragraphs.push(
        new Paragraph({
          children: runs,
          alignment: align === "center"
            ? AlignmentType.CENTER
            : align === "right"
              ? AlignmentType.RIGHT
              : undefined,
        })
      );
    } else if (tag === "blockquote") {
      const text = el.textContent || "";
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, italics: true })],
          indent: { left: 720 },
        })
      );
    } else if (tag === "ul" || tag === "ol") {
      const items = el.querySelectorAll(":scope > li");
      items.forEach((li, idx) => {
        const prefix = tag === "ol" ? `${idx + 1}. ` : "• ";
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(prefix + (li.textContent || ""))],
            indent: { left: 360 },
          })
        );
      });
    } else if (tag === "hr") {
      paragraphs.push(new Paragraph({ children: [new TextRun("———")] }));
    } else if (tag === "pre" || tag === "code") {
      const text = el.textContent || "";
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, font: "Courier New", size: 20 })],
        })
      );
    } else {
      el.childNodes.forEach(processNode);
    }
  }

  function inlineToRuns(el: HTMLElement): TextRun[] {
    const runs: TextRun[] = [];
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || "";
        if (text) runs.push(new TextRun(text));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as HTMLElement;
        const childTag = childEl.tagName.toLowerCase();
        const text = childEl.textContent || "";
        if (!text) return;
        runs.push(
          new TextRun({
            text,
            bold: childTag === "strong" || childTag === "b" || undefined,
            italics: childTag === "em" || childTag === "i" || undefined,
            underline: childTag === "u" ? {} : undefined,
            strike: childTag === "s" || childTag === "del" || undefined,
          })
        );
      }
    });
    return runs.length > 0 ? runs : [new TextRun("")];
  }

  body.childNodes.forEach(processNode);
  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun("")] })];
}

export async function exportToDocx({ title, html }: ExportOptions) {
  const paragraphs = htmlToDocxParagraphs(html);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: title || "Untitled", bold: true })],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = (title || "untitled").replace(/[^\w一-鿿]/g, "_").substring(0, 40) + ".docx";
  saveAs(blob, filename);
}
