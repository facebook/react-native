import {
  ParsedPatchFile,
  PatchFilePart,
  Hunk,
  HunkHeader,
  verifyHunkIntegrity,
} from './parse';
import {assertNever} from './assertNever';

function reverseHunk(hunk: Hunk): Hunk {
  const header: HunkHeader = {
    original: hunk.header.patched,
    patched: hunk.header.original,
  };
  const parts: Hunk['parts'] = [];

  for (const part of hunk.parts) {
    switch (part.type) {
      case 'context':
        parts.push(part);
        break;
      case 'deletion':
        parts.push({
          type: 'insertion',
          lines: part.lines,
          noNewlineAtEndOfFile: part.noNewlineAtEndOfFile,
        });
        break;
      case 'insertion':
        parts.push({
          type: 'deletion',
          lines: part.lines,
          noNewlineAtEndOfFile: part.noNewlineAtEndOfFile,
        });
        break;
      default:
        assertNever(part.type);
    }
  }

  // swap insertions and deletions over so deletions always come first
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i].type === 'insertion' && parts[i + 1].type === 'deletion') {
      const tmp = parts[i];
      parts[i] = parts[i + 1];
      parts[i + 1] = tmp;
      i += 1;
    }
  }

  const result: Hunk = {
    header,
    parts,
  };

  verifyHunkIntegrity(result);

  return result;
}

function reversePatchPart(part: PatchFilePart): PatchFilePart {
  switch (part.type) {
    case 'file creation':
      return {
        type: 'file deletion',
        path: part.path,
        hash: part.hash,
        hunk: part.hunk && reverseHunk(part.hunk),
        mode: part.mode,
      };
    case 'file deletion':
      return {
        type: 'file creation',
        path: part.path,
        hunk: part.hunk && reverseHunk(part.hunk),
        mode: part.mode,
        hash: part.hash,
      };
    case 'rename':
      return {
        type: 'rename',
        fromPath: part.toPath,
        toPath: part.fromPath,
      };
    case 'patch':
      return {
        type: 'patch',
        path: part.path,
        hunks: part.hunks.map(reverseHunk),
        beforeHash: part.afterHash,
        afterHash: part.beforeHash,
      };
    case 'mode change':
      return {
        type: 'mode change',
        path: part.path,
        newMode: part.oldMode,
        oldMode: part.newMode,
      };
  }
}

export const reversePatch = (patch: ParsedPatchFile): ParsedPatchFile => {
  return patch.map(reversePatchPart).reverse();
};
