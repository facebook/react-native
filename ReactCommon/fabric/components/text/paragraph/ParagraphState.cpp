/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphState.h"

#include <react/components/text/conversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

#ifdef ANDROID
folly::dynamic ParagraphState::getDynamic() const {
  return toDynamic(*this);
}
#endif

} // namespace react
} // namespace facebook
