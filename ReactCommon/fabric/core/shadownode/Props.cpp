/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <fabric/core/propsConversions.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

void Props::apply(const RawProps &rawProps) {
  ensureUnsealed();

  applyRawProp(rawProps, "nativeID", nativeId_);
}

const std::string &Props::getNativeId() const {
  return nativeId_;
}

} // namespace react
} // namespace facebook
