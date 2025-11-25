declare module "glob" {
  import typeof FSModule from 'fs';

  declare type MinimatchOptions = {|
    debug?: boolean,
    nobrace?: boolean,
    noglobstar?: boolean,
    dot?: boolean,
    noext?: boolean,
    nocase?: boolean,
    nonull?: boolean,
    matchBase?: boolean,
    nocomment?: boolean,
    nonegate?: boolean,
    flipNegate?: boolean
  |};

  declare type IgnoreLike = {|
    ignored?: (p: Path) => boolean,
    childrenIgnored?: (p: Path) => boolean,
    add?: (ignore: string) => void,
  |};

  declare type GlobOptions = {|
    absolute?: boolean,
    allowWindowsEscape?: boolean,
    cwd?: string | URL,
    dot?: boolean,
    dotRelative?: boolean,
    follow?: boolean,
    ignore?: string | string[] | IgnoreLike,
    magicalBraces?: boolean,
    mark?: boolean,
    matchBase?: boolean,
    maxDepth?: number,
    nobrace?: boolean,
    nocase?: boolean,
    nodir?: boolean,
    noext?: boolean,
    noglobstar?: boolean,
    platform?: 'darwin' | 'win32' | 'linux',
    realpath?: boolean,
    root?: string,
    // NOTE: Instance of `PathScurry`, untyped here to simplify types
    scurry?: mixed,
    stat?: boolean,
    signal?: AbortSignal,
    windowsPathsNoEscape?: boolean,
    withFileTypes?: boolean,
    fs?: FSModule,
    debug?: boolean,
    posix?: boolean,
    includeChildMatches?: boolean,
  |};

  declare class Path {
    // Dirent name retyped as string
    name: string;

    // Dirent methods
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isDirectory(): boolean;
    isFIFO(): boolean;
    isFile(): boolean;
    isSocket(): boolean;
    isSymbolicLink(): boolean;

    root: Path;
    roots: {
      [k: string]: Path;
    };
    parent?: Path;
    nocase: boolean;
    isCWD: boolean;
    splitSep: string | RegExp;
    sep: string;
    +dev: number | void;
    +mode: number | void;
    +nlink: number | void;
    +uid: number | void;
    +gid: number | void;
    +rdev: number | void;
    +blksize: number | void;
    +ino: number | void;
    +size: number | void;
    +blocks: number | void;
    +atimeMs: number | void;
    +mtimeMs: number | void;
    +ctimeMs: number | void;
    +birthtimeMs: number | void;
    +atime: Date | void;
    +mtime: Date | void;
    +ctime: Date | void;
    +birthtime: Date | void;
    +parentPath: string;
    +path: string;
    +depth: number;
    resolve(path?: string): Path;
    relative(): string;
    relativePosix(): string;
    fullpath(): string;
    fullpathPosix(): string;
    lstatCached(): Path | void;
    readlinkCached(): Path | void;
    realpathCached(): Path | void;
    readdirCached(): Path[];
    canReadlink(): boolean;
    calledReaddir(): boolean;
    isENOENT(): boolean;
    isNamed(n: string): boolean;
    readlink(): Promise<Path | void>;
    readlinkSync(): Path | void;
    lstat(): Promise<Path | void>;
    lstatSync(): Path | void;
    readdirCB(cb: (err: Error | null, entries: Path[]) => mixed, allowZalgo?: boolean): void;
    readdir(): Promise<Path[]>;
    readdirSync(): Path[];
    canReaddir(): boolean;
    shouldWalk(dirs: Set<Path | void>, walkFilter?: (e: Path) => boolean): boolean;
    realpath(): Promise<Path | void>;
    realpathSync(): Path | void;
  };

  declare type GlobOptionsWithFileTypesTrue = {|
    ...GlobOptions,
    withFileTypes: true;
    absolute?: void;
    mark?: void;
    posix?: void;
  |};

  declare type GlobOptionsWithFileTypesFalse = {|
    ...GlobOptions,
    withFileTypes?: false;
  |};

  declare type GlobOptionsWithFileTypesUnset = {|
    ...GlobOptions,
    withFileTypes: void;
  |};

  declare type Result<Opts> = Opts extends GlobOptionsWithFileTypesTrue
    ? Path
    : Opts extends GlobOptionsWithFileTypesFalse
    ? string
    : Opts extends GlobOptionsWithFileTypesUnset
    ? string : string | Path;

  declare type Results<Opts> = Result<Opts>[];

  // NOTE: Left out GLOBSTAR identity
  declare type MMPattern = string | RegExp | {};

  declare class Pattern {
    +length: number;
    pattern(): MMPattern;
    isString(): boolean;
    isGlobstar(): boolean;
    isRegExp(): boolean;
    globString(): string;
    hasMore(): boolean;
    rest(): Pattern | null;
    isUNC(): boolean;
    isDrive(): boolean;
    isAbsolute(): boolean;
    root(): string;
    checkFollowGlobstar(): boolean;
    markFollowGlobstar(): boolean;
  }

  declare class Glob<Opts: GlobOptions = GlobOptions> {
    opts: Opts;
    patterns: Pattern[];

    constructor(pattern: string | string[], options: Opts): this;
    walk(): Promise<Results<Opts>>;
    // stream(): Minipass<Result<Opts>, Result<Opts>>;
    // streamSync(): Minipass<Result<Opts>, Result<Opts>>;
    iterateSync(): Iterator<Result<Opts>>;
    iterate(): AsyncIterator<Result<Opts>>;
    @@iterator(): Iterator<Result<Opts>>;
    @@asyncIterator(): AsyncIterator<Result<Opts>>;

    // GlobOptions
    absolute?: boolean,
    allowWindowsEscape?: boolean,
    cwd?: string | URL,
    dot?: boolean,
    dotRelative?: boolean,
    follow?: boolean,
    ignore?: string | string[] | IgnoreLike,
    magicalBraces?: boolean,
    mark?: boolean,
    matchBase?: boolean,
    maxDepth?: number,
    nobrace?: boolean,
    nocase?: boolean,
    nodir?: boolean,
    noext?: boolean,
    noglobstar?: boolean,
    platform?: 'darwin' | 'win32' | 'linux',
    realpath?: boolean,
    root?: string,
    // NOTE: Instance of `PathScurry`, untyped here to simplify types
    scurry?: mixed,
    stat?: boolean,
    signal?: AbortSignal,
    windowsPathsNoEscape?: boolean,
    withFileTypes?: boolean,
    fs?: FSModule,
    debug?: boolean,
    posix?: boolean,
    includeChildMatches?: boolean,
  }

  declare class GlobSync {
    (pattern: string | string[], options: GlobOptionsWithFileTypesTrue): Path[];
    (pattern: string | string[], options: GlobOptionsWithFileTypesFalse): string[];
    (pattern: string | string[], options?: GlobOptionsWithFileTypesUnset): string[];
    (pattern: string | string[], options: GlobOptions): Path[] | string[];
  }

  declare class GlobIterateSync {
    (pattern: string | string[], options: GlobOptionsWithFileTypesTrue): Iterator<Path>;
    (pattern: string | string[], options: GlobOptionsWithFileTypesFalse): Iterator<string>;
    (pattern: string | string[], options?: GlobOptionsWithFileTypesUnset | void): Iterator<string>;
    (pattern: string | string[], options: GlobOptions): Iterator<Path> | Iterator<string>;
  }

  declare class GlobIterate {
    (pattern: string | string[], options: GlobOptionsWithFileTypesTrue): AsyncIterator<Path>;
    (pattern: string | string[], options: GlobOptionsWithFileTypesFalse): AsyncIterator<string>;
    (pattern: string | string[], options?: GlobOptionsWithFileTypesUnset | void): AsyncIterator<string>;
    (pattern: string | string[], options: GlobOptions): AsyncIterator<Path> | AsyncIterator<string>;
    sync: GlobIterateSync;
  }

  declare class GlobModule {
    glob: GlobModule;

    Glob: typeof Glob;

    (pattern: string | string[], options: GlobOptionsWithFileTypesTrue): Promise<Path[]>;
    (pattern: string | string[], options: GlobOptionsWithFileTypesFalse): Promise<string[]>;
    (pattern: string | string[], options: GlobOptions): Promise<Path[] | string[]>;
    (pattern: string | string[], options?: GlobOptionsWithFileTypesUnset | void): Promise<string[]>;

    globIterateSync: GlobIterateSync;
    globIterate: GlobIterate;
    iterateSync: GlobIterateSync;
    iterate: GlobIterate;
    globSync: GlobSync;
    sync: GlobSync;

    /*
    globStreamSync(pattern: string | string[], options: GlobOptionsWithFileTypesTrue): Minipass<Path, Path>;
    globStreamSync(pattern: string | string[], options: GlobOptionsWithFileTypesFalse): Minipass<string, string>;
    globStreamSync(pattern: string | string[], options: GlobOptionsWithFileTypesUnset): Minipass<string, string>;
    globStreamSync(pattern: string | string[], options: GlobOptions): Minipass<Path, Path> | Minipass<string, string>;

    globStream(pattern: string | string[], options: GlobOptionsWithFileTypesFalse): Minipass<string, string>;
    globStream(pattern: string | string[], options: GlobOptionsWithFileTypesTrue): Minipass<Path, Path>;
    globStream(pattern: string | string[], options?: GlobOptionsWithFileTypesUnset | void): Minipass<string, string>;
    globStream(pattern: string | string[], options: GlobOptions): Minipass<Path, Path> | Minipass<string, string>;
    */

    hasMagic(pattern: string, options?: GlobOptions): boolean;

    // escape: (s: string, { windowsPathsNoEscape, magicalBraces, }?: Pick<import("minimatch").MinimatchOptions, "windowsPathsNoEscape" | "magicalBraces">) => string;
    // unescape: (s: string, { windowsPathsNoEscape, magicalBraces, }?: Pick<import("minimatch").MinimatchOptions, "windowsPathsNoEscape" | "magicalBraces">) => string;
  }

  declare module.exports: GlobModule;
}
