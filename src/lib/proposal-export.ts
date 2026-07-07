export type ProposalExportSection = {
  content: string;
  heading: string;
};

export type ProposalExportDocument = {
  contextLines: string[];
  sections: ProposalExportSection[];
  text: string;
  title: string;
};

type BuildProposalExportInput = {
  contextLines: string[];
  sections: ProposalExportSection[];
  title: string;
};

const aiPhrasePatterns = [
  /^here(?:'| i)s\s+/i,
  /^this is\s+/i,
  /^i suggest\s+/i,
  /^you can\s+/i,
  /^hope this helps/i,
  /^as an ai/i,
  /^certainly[,!.\s]/i,
  /^of course[,!.\s]/i,
  /^below is\s+/i,
  /^in conclusion[,!.\s]/i,
  /^overall[,!.\s]/i,
];

const placeholderPatterns = [
  /^\[.*\]$/,
  /^not drafted yet$/i,
  /^to be completed$/i,
  /^n\/a$/i,
];

function normalizeForDedupe(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u1ef9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, ""),
    )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[ \t]+/g, " ");
}

export function cleanProposalContent(value: string) {
  const withoutMarkdown = stripMarkdown(value);
  const seen = new Set<string>();

  return withoutMarkdown
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !placeholderPatterns.some((pattern) => pattern.test(line)))
    .map((line) =>
      aiPhrasePatterns.reduce(
        (currentLine, pattern) => currentLine.replace(pattern, ""),
        line,
      ),
    )
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => {
      const dedupeKey = normalizeForDedupe(line);

      if (!dedupeKey || seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    })
    .join("\n\n");
}

export function buildProposalExport({
  contextLines,
  sections,
  title,
}: BuildProposalExportInput): ProposalExportDocument {
  const cleanedSections = sections
    .map((section) => ({
      ...section,
      content: cleanProposalContent(section.content),
    }))
    .filter((section) => section.content.length > 0);
  const cleanedContextLines = contextLines
    .map((line) => cleanProposalContent(line).replace(/\n+/g, " "))
    .filter(Boolean);
  const text = [
    title,
    "",
    ...cleanedContextLines,
    "",
    ...cleanedSections.flatMap((section) => [
      section.heading,
      "",
      section.content,
      "",
    ]),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    contextLines: cleanedContextLines,
    sections: cleanedSections,
    text,
    title,
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createParagraphXml(
  value: string,
  options: { bold?: boolean; fontSize?: number; spacingBefore?: number } = {},
) {
  const runProperties = [
    options.bold ? "<w:b/>" : "",
    options.fontSize ? `<w:sz w:val="${options.fontSize}"/>` : "",
  ].join("");
  const paragraphProperties = options.spacingBefore
    ? `<w:pPr><w:spacing w:before="${options.spacingBefore}" w:after="120"/></w:pPr>`
    : "";

  return [
    "<w:p>",
    paragraphProperties,
    "<w:r>",
    runProperties ? `<w:rPr>${runProperties}</w:rPr>` : "",
    `<w:t xml:space="preserve">${escapeXml(value)}</w:t>`,
    "</w:r>",
    "</w:p>",
  ].join("");
}

function createDocumentXml(document: ProposalExportDocument) {
  const body = [
    createParagraphXml(document.title, {
      bold: true,
      fontSize: 36,
      spacingBefore: 0,
    }),
    ...document.contextLines.map((line) =>
      createParagraphXml(line, { fontSize: 22 }),
    ),
    ...document.sections.flatMap((section) => [
      createParagraphXml(section.heading, {
        bold: true,
        fontSize: 28,
        spacingBefore: 360,
      }),
      ...section.content
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph) => createParagraphXml(paragraph, { fontSize: 22 })),
    ]),
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>',
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${body}</w:document>`;
}

const crcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  crcTable[index] = value >>> 0;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value: number) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });

  return output;
}

function createZip(files: Array<{ data: string; name: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.data);
    const checksum = crc32(dataBytes);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(dataBytes.length),
      ...uint32(dataBytes.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
    ]);
    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(dataBytes.length),
      ...uint32(dataBytes.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
    ]);

    localParts.push(localHeader, nameBytes, dataBytes);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + dataBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralDirectory.length),
    ...uint32(offset),
    ...uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

export function createDocxBlob(document: ProposalExportDocument) {
  const files = [
    {
      name: "[Content_Types].xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    },
    {
      name: "word/document.xml",
      data: createDocumentXml(document),
    },
  ];

  return new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function createTextBlob(document: ProposalExportDocument) {
  return new Blob([document.text], {
    type: "text/plain;charset=utf-8",
  });
}
