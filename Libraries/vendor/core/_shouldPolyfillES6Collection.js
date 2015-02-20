/**
 * @generated SignedSource<<6c1a82d2f5918f03f3f0e5825e1f32f3>>
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
 * Copyright 2013-2014 Facebook, Inc.
 * @providesModule _shouldPolyfillES6Collection
 * @preventMunge
 * @typechecks
 */

/**
 * Given a collection class name (Map or Set) return whether it's safe to use
 * the native polyfill.
 *
 * @param {string} collectionName
 */
function shouldPolyfillES6Collection(collectionName) {
  var Collection = global[collectionName];
  if (Collection == null) {
    return true;
  }

  var proto = Collection.prototype;

  // These checks are adapted from es6-shim https://fburl.com/34437854
  return Collection == null ||
    typeof Collection !== 'function' ||
    typeof proto.clear !== 'function' ||
    new Collection().size !== 0 ||
    typeof proto.keys !== 'function' ||
    typeof proto.forEach !== 'function' ||
    isCallableWithoutNew(Collection) ||
    !supportsSubclassing(Collection);
}

/**
 * Given a class can we subclass it?
 *
 * @param {function} Collection
 */
function supportsSubclassing(Collection) {
  class SubCollection extends Collection {}
  try {
    var s = (new SubCollection([]));
    // Firefox 32 will throw a type error when any operation is called on a
    // subclass.
    s.size;
    return s instanceof Collection;
  } catch (e) {
    return false;
  }
}

/**
 * Given a constructor can we call it without `new`?
 *
 * @param {function} Collection
 */
function isCallableWithoutNew(Collection) {
  try {
    Collection();
  } catch (e) {
    return false;
  }
  return true;
}

module.exports = shouldPolyfillES6Collection;
