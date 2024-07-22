declare module 'semver' {
  declare type Release =
    | "major"
    | "premajor"
    | "minor"
    | "preminor"
    | "patch"
    | "prepatch"
    | "prerelease";

  // The supported comparators are taken from the source here:
  // https://github.com/npm/node-semver/blob/8bd070b550db2646362c9883c8d008d32f66a234/semver.js#L623
  declare type Operator =
    | "==="
    | "!=="
    | "=="
    | "="
    | "" // Not sure why you would want this, but whatever.
    | "!="
    | ">"
    | ">="
    | "<"
    | "<=";

  declare class SemVer {
    build: Array<string>;
    loose: ?boolean;
    major: number;
    minor: number;
    patch: number;
    prerelease: Array<string | number>;
    raw: string;
    version: string;

    constructor(version: string | SemVer, options?: Options): SemVer;
    compare(other: string | SemVer): -1 | 0 | 1;
    compareMain(other: string | SemVer): -1 | 0 | 1;
    comparePre(other: string | SemVer): -1 | 0 | 1;
    compareBuild(other: string | SemVer): -1 | 0 | 1;
    format(): string;
    inc(release: Release, identifier: string): this;
  }

  declare class Comparator {
    options?: Options;
    operator: Operator;
    semver: SemVer;
    value: string;

    constructor(comp: string | Comparator, options?: Options): Comparator;
    parse(comp: string): void;
    test(version: string): boolean;
  }

  declare class Range {
    loose: ?boolean;
    raw: string;
    set: Array<Array<Comparator>>;

    constructor(range: string | Range, options?: Options): Range;
    format(): string;
    parseRange(range: string): Array<Comparator>;
    test(version: string): boolean;
    toString(): string;
  }

  declare var SEMVER_SPEC_VERSION: string;
  declare var re: Array<RegExp>;
  declare var src: Array<string>;

  declare type Options = {
    options?: Options,
    includePrerelease?: boolean,
    ...
  } | boolean;

  // Functions
  declare function valid(v: string | SemVer, options?: Options): string | null;
  declare function clean(v: string | SemVer, options?: Options): string | null;
  declare function inc(
    v: string | SemVer,
    release: Release,
    options?: Options,
    identifier?: string
  ): string | null;
  declare function inc(
    v: string | SemVer,
    release: Release,
    identifier: string
  ): string | null;
  declare function major(v: string | SemVer, options?: Options): number;
  declare function minor(v: string | SemVer, options?: Options): number;
  declare function patch(v: string | SemVer, options?: Options): number;
  declare function intersects(r1: string | SemVer, r2: string | SemVer, loose?: boolean): boolean;
  declare function minVersion(r: string | Range): Range | null;

  // Comparison
  declare function gt(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function gte(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function lt(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function lte(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function eq(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function neq(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function cmp(
    v1: string | SemVer,
    comparator: Operator,
    v2: string | SemVer,
    options?: Options
  ): boolean;
  declare function compare(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): -1 | 0 | 1;
  declare function rcompare(
    v1: string | SemVer,
    v2: string | SemVer,
    options?: Options
  ): -1 | 0 | 1;
  declare function diff(v1: string | SemVer, v2: string | SemVer): ?Release;
  declare function intersects(comparator: Comparator): boolean;
  declare function sort(
    list: Array<string | SemVer>,
    options?: Options
  ): Array<string | SemVer>;
  declare function rsort(
    list: Array<string | SemVer>,
    options?: Options
  ): Array<string | SemVer>;
  declare function compareIdentifiers(
    v1: string | SemVer,
    v2: string | SemVer
  ): -1 | 0 | 1;
  declare function rcompareIdentifiers(
    v1: string | SemVer,
    v2: string | SemVer
  ): -1 | 0 | 1;

  // Ranges
  declare function validRange(
    range: string | Range,
    options?: Options
  ): string | null;
  declare function satisfies(
    version: string | SemVer,
    range: string | Range,
    options?: Options
  ): boolean;
  declare function maxSatisfying(
    versions: Array<string | SemVer>,
    range: string | Range,
    options?: Options
  ): string | SemVer | null;
  declare function minSatisfying(
    versions: Array<string | SemVer>,
    range: string | Range,
    options?: Options
  ): string | SemVer | null;
  declare function gtr(
    version: string | SemVer,
    range: string | Range,
    options?: Options
  ): boolean;
  declare function ltr(
    version: string | SemVer,
    range: string | Range,
    options?: Options
  ): boolean;
  declare function outside(
    version: string | SemVer,
    range: string | Range,
    hilo: ">" | "<",
    options?: Options
  ): boolean;
  declare function intersects(
    range: Range
  ): boolean;
  declare function simplifyRange(
    ranges: Array<string>,
    range: string | Range,
    options?: Options,
  ): string | Range;
  declare function subset(
      sub: string | Range,
      dom: string | Range,
      options?: Options,
  ): boolean;

  // Coercion
  declare function coerce(
    version: string | SemVer,
    options?: Options
  ): ?SemVer

  // Not explicitly documented, or deprecated
  declare function parse(version: string, options?: Options): ?SemVer;
  declare function toComparators(
    range: string | Range,
    options?: Options
  ): Array<Array<string>>;
}

declare module 'semver/preload' {
  declare module.exports: $Exports<"semver">;
}
