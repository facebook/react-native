import { assertNever } from './assertNever';

export interface HunkHeader {
  original: {
    start: number;
    length: number;
  };
  patched: {
    start: number;
    length: number;
  };
}

export const parseHunkHeaderLine = (headerLine: string): HunkHeader => {
  const match = headerLine
    .trim()
    .match(/^@@ -(\d+)(,(\d+))? \+(\d+)(,(\d+))? @@.*/);
  if (!match) {
    throw new Error(`Bad header line: '${headerLine}'`);
  }

  return {
    original: {
      start: Math.max(Number(match[1]), 1),
      length: Number(match[3] || 1),
    },
    patched: {
      start: Math.max(Number(match[4]), 1),
      length: Number(match[6] || 1),
    },
  };
};

export const NON_EXECUTABLE_FILE_MODE = 0o644;
export const EXECUTABLE_FILE_MODE = 0o755;

type FileMode = typeof NON_EXECUTABLE_FILE_MODE | typeof EXECUTABLE_FILE_MODE;

interface PatchMutationPart {
  type: 'context' | 'insertion' | 'deletion';
  lines: string[];
  noNewlineAtEndOfFile: boolean;
}

interface FileRename {
  type: 'rename';
  fromPath: string;
  toPath: string;
}

interface FileModeChange {
  type: 'mode change';
  path: string;
  oldMode: FileMode;
  newMode: FileMode;
}

export interface FilePatch {
  type: 'patch';
  path: string;
  hunks: Hunk[];
  beforeHash: string | null;
  afterHash: string | null;
}

interface FileDeletion {
  type: 'file deletion';
  path: string;
  mode: FileMode;
  hunk: Hunk | null;
  hash: string | null;
}

interface FileCreation {
  type: 'file creation';
  mode: FileMode;
  path: string;
  hunk: Hunk | null;
  hash: string | null;
}

export type PatchFilePart =
  | FilePatch
  | FileDeletion
  | FileCreation
  | FileRename
  | FileModeChange;

export type ParsedPatchFile = PatchFilePart[];

type State = 'parsing header' | 'parsing hunks';

interface FileDeets {
  diffLineFromPath: string | null;
  diffLineToPath: string | null;
  oldMode: string | null;
  newMode: string | null;
  deletedFileMode: string | null;
  newFileMode: string | null;
  renameFrom: string | null;
  renameTo: string | null;
  beforeHash: string | null;
  afterHash: string | null;
  fromPath: string | null;
  toPath: string | null;
  hunks: Hunk[] | null;
}

export interface Hunk {
  header: HunkHeader;
  parts: PatchMutationPart[];
}

const emptyFilePatch = (): FileDeets => ({
  diffLineFromPath: null,
  diffLineToPath: null,
  oldMode: null,
  newMode: null,
  deletedFileMode: null,
  newFileMode: null,
  renameFrom: null,
  renameTo: null,
  beforeHash: null,
  afterHash: null,
  fromPath: null,
  toPath: null,
  hunks: null,
});

const emptyHunk = (headerLine: string): Hunk => ({
  header: parseHunkHeaderLine(headerLine),
  parts: [],
});

const hunkLinetypes: {
  [k: string]: PatchMutationPart['type'] | 'pragma' | 'header';
} = {
  '@': 'header',
  '-': 'deletion',
  '+': 'insertion',
  ' ': 'context',
  '\\': 'pragma',
  // Treat blank lines as context
  undefined: 'context',
};

function parsePatchLines(
  lines: string[],
  { supportLegacyDiffs }: { supportLegacyDiffs: boolean },
): FileDeets[] {
  const result: FileDeets[] = [];
  let currentFilePatch: FileDeets = emptyFilePatch();
  let state: State = 'parsing header';
  let currentHunk: Hunk | null = null;
  let currentHunkMutationPart: PatchMutationPart | null = null;

  function commitHunk() {
    if (currentHunk) {
      if (currentHunkMutationPart) {
        currentHunk.parts.push(currentHunkMutationPart);
        currentHunkMutationPart = null;
      }
      currentFilePatch.hunks!.push(currentHunk);
      currentHunk = null;
    }
  }

  function commitFilePatch() {
    commitHunk();
    result.push(currentFilePatch);
    currentFilePatch = emptyFilePatch();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (state === 'parsing header') {
      if (line.startsWith('@@')) {
        state = 'parsing hunks';
        currentFilePatch.hunks = [];
        i--;
      } else if (line.startsWith('diff --git ')) {
        if (currentFilePatch && currentFilePatch.diffLineFromPath) {
          commitFilePatch();
        }
        const match = line.match(/^diff --git a\/(.*?) b\/(.*?)\s*$/);
        if (!match) {
          throw new Error('Bad diff line: ' + line);
        }
        currentFilePatch.diffLineFromPath = match[1];
        currentFilePatch.diffLineToPath = match[2];
      } else if (line.startsWith('old mode ')) {
        currentFilePatch.oldMode = line.slice('old mode '.length).trim();
      } else if (line.startsWith('new mode ')) {
        currentFilePatch.newMode = line.slice('new mode '.length).trim();
      } else if (line.startsWith('deleted file mode ')) {
        currentFilePatch.deletedFileMode = line
          .slice('deleted file mode '.length)
          .trim();
      } else if (line.startsWith('new file mode ')) {
        currentFilePatch.newFileMode = line
          .slice('new file mode '.length)
          .trim();
      } else if (line.startsWith('rename from ')) {
        currentFilePatch.renameFrom = line.slice('rename from '.length).trim();
      } else if (line.startsWith('rename to ')) {
        currentFilePatch.renameTo = line.slice('rename to '.length).trim();
      } else if (line.startsWith('index ')) {
        const match = line.match(/(\w+)\.\.(\w+)/);
        if (!match) {
          continue;
        }
        currentFilePatch.beforeHash = match[1];
        currentFilePatch.afterHash = match[2];
      } else if (line.startsWith('--- ')) {
        currentFilePatch.fromPath = line.slice('--- a/'.length).trim();
      } else if (line.startsWith('+++ ')) {
        currentFilePatch.toPath = line.slice('+++ b/'.length).trim();
      }
    } else {
      if (supportLegacyDiffs && line.startsWith('--- a/')) {
        state = 'parsing header';
        commitFilePatch();
        i--;
        continue;
      }
      // parsing hunks
      const lineType = hunkLinetypes[line[0]] || null;
      switch (lineType) {
        case 'header':
          commitHunk();
          currentHunk = emptyHunk(line);
          break;
        case null:
          // unrecognized, bail out
          state = 'parsing header';
          commitFilePatch();
          i--;
          break;
        case 'pragma':
          if (!line.startsWith('\\ No newline at end of file')) {
            throw new Error('Unrecognized pragma in patch file: ' + line);
          }
          if (!currentHunkMutationPart) {
            throw new Error(
              'Bad parser state: No newline at EOF pragma encountered without context',
            );
          }
          currentHunkMutationPart.noNewlineAtEndOfFile = true;
          break;
        case 'insertion':
        case 'deletion':
        case 'context':
          if (!currentHunk) {
            throw new Error(
              'Bad parser state: Hunk lines encountered before hunk header',
            );
          }
          if (
            currentHunkMutationPart &&
            currentHunkMutationPart.type !== lineType
          ) {
            currentHunk.parts.push(currentHunkMutationPart);
            currentHunkMutationPart = null;
          }
          if (!currentHunkMutationPart) {
            currentHunkMutationPart = {
              type: lineType,
              lines: [],
              noNewlineAtEndOfFile: false,
            };
          }
          currentHunkMutationPart.lines.push(line.slice(1));
          break;
        default:
          // exhausitveness check
          assertNever(lineType);
      }
    }
  }

  commitFilePatch();

  for (const { hunks } of result) {
    if (hunks) {
      for (const hunk of hunks) {
        verifyHunkIntegrity(hunk);
      }
    }
  }

  return result;
}

export function interpretParsedPatchFile(files: FileDeets[]): ParsedPatchFile {
  const result: ParsedPatchFile = [];

  for (const file of files) {
    const {
      diffLineFromPath,
      diffLineToPath,
      oldMode,
      newMode,
      deletedFileMode,
      newFileMode,
      renameFrom,
      renameTo,
      beforeHash,
      afterHash,
      fromPath,
      toPath,
      hunks,
    } = file;
    const type: PatchFilePart['type'] = renameFrom
      ? 'rename'
      : deletedFileMode
        ? 'file deletion'
        : newFileMode
          ? 'file creation'
          : hunks && hunks.length > 0
            ? 'patch'
            : 'mode change';

    let destinationFilePath: string | null = null;
    switch (type) {
      case 'rename':
        if (!renameFrom || !renameTo) {
          throw new Error('Bad parser state: rename from & to not given');
        }
        result.push({
          type: 'rename',
          fromPath: renameFrom,
          toPath: renameTo,
        });
        destinationFilePath = renameTo;
        break;
      case 'file deletion': {
        const path = diffLineFromPath || fromPath;
        if (!path) {
          throw new Error('Bad parse state: no path given for file deletion');
        }
        result.push({
          type: 'file deletion',
          hunk: (hunks && hunks[0]) || null,
          path,
          mode: parseFileMode(deletedFileMode!),
          hash: beforeHash,
        });
        break;
      }
      case 'file creation': {
        const path = diffLineToPath || toPath;
        if (!path) {
          throw new Error('Bad parse state: no path given for file creation');
        }
        result.push({
          type: 'file creation',
          hunk: (hunks && hunks[0]) || null,
          path,
          mode: parseFileMode(newFileMode!),
          hash: afterHash,
        });
        break;
      }
      case 'patch':
      case 'mode change':
        destinationFilePath = toPath || diffLineToPath;
        break;
      default:
        assertNever(type);
    }

    if (destinationFilePath && oldMode && newMode && oldMode !== newMode) {
      result.push({
        type: 'mode change',
        path: destinationFilePath,
        oldMode: parseFileMode(oldMode),
        newMode: parseFileMode(newMode),
      });
    }

    if (destinationFilePath && hunks && hunks.length) {
      result.push({
        type: 'patch',
        path: destinationFilePath,
        hunks,
        beforeHash,
        afterHash,
      });
    }
  }

  return result;
}

function parseFileMode(mode: string): FileMode {
  // tslint:disable-next-line:no-bitwise
  const parsedMode = parseInt(mode, 8) & 0o777;
  if (
    parsedMode !== NON_EXECUTABLE_FILE_MODE &&
    parsedMode !== EXECUTABLE_FILE_MODE
  ) {
    throw new Error('Unexpected file mode string: ' + mode);
  }
  return parsedMode;
}

export function parsePatchFile(file: string): ParsedPatchFile {
  const lines = file.split(/\r?\n/g);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  try {
    return interpretParsedPatchFile(
      parsePatchLines(lines, { supportLegacyDiffs: false }),
    );
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === 'hunk header integrity check failed'
    ) {
      return interpretParsedPatchFile(
        parsePatchLines(lines, { supportLegacyDiffs: true }),
      );
    }
    throw e;
  }
}

export function verifyHunkIntegrity(hunk: Hunk) {
  // verify hunk integrity
  let originalLength = 0;
  let patchedLength = 0;
  for (const { type, lines } of hunk.parts) {
    switch (type) {
      case 'context':
        patchedLength += lines.length;
        originalLength += lines.length;
        break;
      case 'deletion':
        originalLength += lines.length;
        break;
      case 'insertion':
        patchedLength += lines.length;
        break;
      default:
        assertNever(type);
    }
  }

  if (
    originalLength !== hunk.header.original.length ||
    patchedLength !== hunk.header.patched.length
  ) {
    throw new Error('hunk header integrity check failed');
  }
}
