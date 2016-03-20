// Copyright 2004-present Facebook. All Rights Reserved.
// @nolint

// These annotations are copy/pasted from the built-in Flow definitions for
// Native Set.

declare module "Set" {
  // Use the name "SetPolyfill" so that we don't get confusing error
  // messages about "Using Set instead of Set".
  declare class SetPolyfill<T> {
    @@iterator(): Iterator<T>;
    add(value: T): SetPolyfill<T>;
    clear(): void;
    delete(value: T): boolean;
    entries(): Iterator<[T, T]>;
    forEach(callbackfn: (value: T, index: T, set: SetPolyfill<T>) => mixed, thisArg?: any): void;
    has(value: T): boolean;
    keys(): Iterator<T>;
    size: number;
    values(): Iterator<T>;
  }

  // Don't "declare class exports" directly, otherwise in error messages our
  // show up as "exports" instead of "Set" or "SetPolyfill".
  declare var exports: typeof SetPolyfill;
}
