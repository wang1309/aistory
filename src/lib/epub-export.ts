import JSZip from "jszip";
import { saveAs } from "file-saver";

type ExportOptions = {
  title: string;
  author?: string;
  html: string;
  locale?: string;
};

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function buildContentOpf(title: string, author: string, lang: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${lang}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`;
}

function buildNav(title: string, tocTitle: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(tocTitle)}</title></head>
<body>
  <nav epub:type="toc">
    <h1>${escapeXml(tocTitle)}</h1>
    <ol>
      <li><a href="chapter1.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
}

function buildChapter(title: string, html: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: serif; line-height: 1.6; padding: 1em; }
    h1, h2, h3 { margin-top: 1.5em; }
    blockquote { margin-left: 1.5em; font-style: italic; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${html}
</body>
</html>`;
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function exportToEpub({ title, author, html, locale }: ExportOptions) {
  const lang = locale?.startsWith("zh") ? "zh" : "en";
  const tocTitle = lang === "zh" ? "目录" : "Table of Contents";
  const authorName = author || "AI Story Generator";

  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip");
  zip.file("META-INF/container.xml", CONTAINER_XML);
  zip.file("OEBPS/content.opf", buildContentOpf(title || "Untitled", authorName, lang));
  zip.file("OEBPS/nav.xhtml", buildNav(title || "Untitled", tocTitle));
  zip.file("OEBPS/chapter1.xhtml", buildChapter(title || "Untitled", html));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
  });

  const filename = (title || "untitled").replace(/[^\w一-鿿]/g, "_").substring(0, 40) + ".epub";
  saveAs(blob, filename);
}
