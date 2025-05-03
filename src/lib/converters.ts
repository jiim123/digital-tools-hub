// Supported formats for conversion
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'tiff'] as const;
export const SUPPORTED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'] as const;

export type SupportedFormat = typeof SUPPORTED_IMAGE_FORMATS[number] | typeof SUPPORTED_DOCUMENT_FORMATS[number];

// Format groups for better organization
export const FORMAT_GROUPS = {
  'Images': SUPPORTED_IMAGE_FORMATS,
  'Documents': SUPPORTED_DOCUMENT_FORMATS,
} as const;

// Mapping of source formats to their possible target formats
export const supportedConversions: Record<string, string[]> = {
  // Image formats
  'jpg': ['png', 'webp', 'tiff'],
  'jpeg': ['png', 'webp', 'tiff'],
  'png': ['jpg', 'jpeg', 'webp', 'tiff'],
  'webp': ['jpg', 'jpeg', 'png', 'tiff'],
  'tiff': ['jpg', 'jpeg', 'png', 'webp'],

  // Document formats
  'pdf': ['doc', 'docx', 'ppt', 'pptx'], // PDF to Word and PowerPoint
  'doc': ['pdf', 'docx', 'ppt', 'pptx'],
  'docx': ['pdf', 'doc', 'ppt', 'pptx'],
  'ppt': ['pdf'],
  'pptx': ['pdf'],
  'xls': ['xlsx', 'pdf'],
  'xlsx': ['xls', 'pdf'],
};

// MIME type mapping
export const MIME_TYPES: Record<SupportedFormat, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'tiff': 'image/tiff',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}; 