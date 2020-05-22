/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTText.h>
#include <react/components/art/ARTElement.h>
#include <react/components/art/conversions.h>

namespace facebook {
namespace react {

#ifdef ANDROID
folly::dynamic ARTText::getDynamic() const {
  return toDynamic(*this);
}
#endif

} // namespace react
} // namespace facebook
