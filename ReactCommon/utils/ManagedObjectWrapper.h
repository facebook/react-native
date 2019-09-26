/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __OBJC__
#ifdef __cplusplus

#include <memory>

namespace facebook {
namespace react {

/*
 * `wrapManagedObject` and `unwrapManagedObject` are wrapper functions that
 * convert ARC-managed objects into `std::shared_ptr<void>` and vice-versa. It's
 * a very useful mechanism when we need to pass Objective-C objects through pure
 * C++ code, pass blocks into C++ lambdas, and so on.
 *
 * The idea behind this mechanism is quite simple but tricky: When we
 * instantiate a C++ shared pointer for a managed object, we practically call
 * `CFRetain` for it once and then we represent this single retaining operation
 * as a counter inside the shared pointer; when the counter became zero, we call
 * `CFRelease` on the object. In this model, one bump of ARC-managed counter is
 * represented as multiple bumps of C++ counter, so we can have multiple
 * counters for the same object that form some kind of counters tree.
 */
inline std::shared_ptr<void> wrapManagedObject(id object) {
  return std::shared_ptr<void>((__bridge_retained void *)object, CFRelease);
}

inline id unwrapManagedObject(std::shared_ptr<void> const &object) {
  return (__bridge id)object.get();
}

} // namespace react
} // namespace facebook

#endif
#endif
