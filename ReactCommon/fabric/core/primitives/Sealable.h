/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

/*
 * Represents something which can be *sealed* (imperatively marked as immutable).
 *
 * Why do we need this? In Fabric, some objects are semi-immutable
 * even if they explicitly marked as `const`. It means that in some special
 * cases those objects can be const-cast-away and then mutated. That comes from
 * the fact that we share some object's life-cycle responsibilities with React
 * and the immutability is guaranteed by some logic splitted between native and
 * JavaScript worlds (which makes impossible to fully use immutability
 * enforcement at a language level).
 * To detect possible errors as early as possible we additionally mark objects
 * as *sealed* after some stage and then enforce this at run-time.
 *
 * How to use:
 *   1. Inherit your class from `Sealable`.
 *   2. Call `ensureUnsealed()` from all non-const methods.
 *   3. Call `seal()` at some point from which any modifications
 *      must be prevented.
 */
class Sealable {
public:
  /*
   * Seals the object. This operation is irreversible;
   * the object cannot be "unsealed" after being sealing.
   */
  void seal() const;

  /*
   * Returns if the object already sealed or not.
   */
  bool getSealed() const;

protected:
  /*
   * Throws an exception if the object is sealed.
   * Call this from all non-`const` methods.
   */
  void ensureUnsealed() const;

private:
  mutable bool sealed_ {false};
};

} // namespace react
} // namespace facebook
