/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ManagedObjectWrapper.h"

#if TARGET_OS_MAC

namespace facebook {
namespace react {
namespace detail {

void wrappedManagedObjectDeleter(void *cfPointer) noexcept
{
  // A shared pointer does call custom deleter on `nullptr`s.
  // This is somewhat counter-intuitively but makes sense considering the type-erasured nature of shared pointer and an
  // aliasing constructor feature. `CFRelease` crashes on null pointer though. Therefore we must check for this case
  // explicitly.
  if (cfPointer == NULL) {
    return;
  }

  CFRelease(cfPointer);
}

} // namespace detail
} // namespace react
} // namespace facebook

@implementation RCTInternalGenericWeakWrapper
@end

#endif
