export type DetectedFileType = 'pdf' | 'docx' | 'doc' | 'image' | 'text' | 'unknown';

export function detectFileType(buffer: Buffer): DetectedFileType {
  if (buffer.length < 4) return 'unknown';

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf';
  }

  // DOCX / ZIP: PK\x03\x04, PK\x05\x06 (empty), PK\x07\x08 (spanned)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  ) {
    return 'docx';
  }

  // Legacy .doc (OLE compound file): D0 CF 11 E0
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return 'doc';
  }

  // Images: JPEG, PNG, GIF, WEBP/RIFF
  if (
    (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
    (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) ||
    (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||
    (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46)
  ) {
    return 'image';
  }

  return 'text';
}

export function validateFileContent(buffer: Buffer, claimedExtension: string): string | null {
  const detected = detectFileType(buffer);

  if (detected === 'pdf') {
    return "PDFs aren't supported because text extraction is unreliable. Export as .docx or .txt, or paste the text directly.";
  }
  if (detected === 'doc') {
    return "Older .doc files aren't supported. Please save as .docx.";
  }
  if (detected === 'image') {
    return "Images aren't supported. Please paste the text or upload as a document.";
  }

  if (claimedExtension === 'docx' && detected !== 'docx') {
    return "This doesn't look like a valid .docx file.";
  }

  if ((claimedExtension === 'md' || claimedExtension === 'txt') && detected !== 'text') {
    return "This doesn't look like a valid text file.";
  }

  return null;
}
