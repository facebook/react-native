/**
 * @generated SignedSource<<bf0749e529897a7c9687fff37310d4d2>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule _shouldPolyfillES6Collection
 * @preventMunge
 * @flow
 */

/**
 * Checks whether a collection name (e.g. "Map" or "Set") has a native polyfill
 * that is safe to be used.
 */
function shouldPolyfillES6Collection(collectionName: string): boolean {
  var Collection = global[collectionName];
  if (Collection == null) {
    return true;
  }

  // The iterator protocol depends on `Symbol.iterator`. If a collection is
  // implemented, but `Symbol` is not, it's going to break iteration because
  // we'll be using custom "@@iterator" instead, which is not implemented on
  // native collections.
  if (typeof global.Symbol !== 'function') {
    return true;
  }

  var proto = Collection.prototype;

  // These checks are adapted from es6-shim: https://fburl.com/34437854
  // NOTE: `isCallableWithoutNew` and `!supportsSubclassing` are not checked
  // because they make debugging with "break on exceptions" difficult.
  return Collection == null ||
    typeof Collection !== 'function' ||
    typeof proto.clear !== 'function' ||
    new Collection().size !== 0 ||
    typeof proto.keys !== 'function' ||
    typeof proto.forEach !== 'function';
}

module.exports = shouldPolyfillES6Collection;
