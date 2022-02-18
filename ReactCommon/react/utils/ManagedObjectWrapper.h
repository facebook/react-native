/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

#if defined(__OBJC__) && defined(__cplusplus)
#if TARGET_OS_MAC && TARGET_OS_IPHONE

#include <memory>

#import <Foundation/Foundation.h>

@interface RCTInternalGenericWeakWrapper : NSObject
@property (nonatomic, weak) id object;
@end

namespace facebook {
namespace react {

namespace detail {

/*
 * A custom deleter used for the deallocation of Objective-C managed objects.
 * To be used only by `wrapManagedObject`.
 */
void wrappedManagedObjectDeleter(void *cfPointer) noexcept;

}

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
inline std::shared_ptr<void> wrapManagedObject(id object) noexcept
{
  return std::shared_ptr<void>((__bridge_retained void *)object, detail::wrappedManagedObjectDeleter);
}

inline id unwrapManagedObject(std::shared_ptr<void> const &object) noexcept
{
  return (__bridge id)object.get();
}

inline std::shared_ptr<void> wrapManagedObjectWeakly(id object) noexcept
{
  RCTInternalGenericWeakWrapper *weakWrapper = [RCTInternalGenericWeakWrapper new];
  weakWrapper.object = object;
  return wrapManagedObject(weakWrapper);
}

inline id unwrapManagedObjectWeakly(std::shared_ptr<void> const &object) noexcept
{
  RCTInternalGenericWeakWrapper *weakWrapper = (RCTInternalGenericWeakWrapper *)unwrapManagedObject(object);
  react_native_assert(weakWrapper && "`RCTInternalGenericWeakWrapper` instance must not be `nil`.");
  return weakWrapper.object;
}

} // namespace react
} // namespace facebook

#endif
#endif
