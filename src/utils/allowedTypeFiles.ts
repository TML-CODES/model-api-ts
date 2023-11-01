export const allowedExtensions = [
  'jpeg',
  'pjpeg',
  'png',
  'gif',
  'pdf',
  'svg',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'gif',
  'jpg',
  'mp4',
  'mp3',
  'mkv',
  'mov',
  'wmv',
  'avi',
  'm4v',
] as const;

export type AllowedExtensions = typeof allowedExtensions[number];

export function getFileType(extension: AllowedExtensions) {
  switch (extension) {
    case 'avi':
    case 'mp4':
    case 'mp3':
    case 'mkv':
    case 'm4v':
    case 'mov':
      return 'video';
    case 'jpeg':
    case 'pjpeg':
    case 'gif':
    case 'png':
    case 'svg':
      return 'image';
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return 'text';
    case 'xls':
    case 'xlsx':
      return 'spreadsheet';
    default:
      return 'others';
  }
}
