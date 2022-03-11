import {isTextSync, isBinarySync} from 'istextorbinary';

export function isFileText(filepath: string) {
  return isTextSync(filepath);
}

export function isFileBinary(filepath: string) {
  return isBinarySync(filepath);
}
