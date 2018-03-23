/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <folly/dynamic.h>

namespace facebook {
namespace react {

void Props::apply(const RawProps &rawProps) {
  ensureUnsealed();

  for (auto const &pair : rawProps) {
    auto const &name = pair.first;
    auto const &value = pair.second;

    if (name == "nativeID") {
      nativeId_ = value.asString();
    }
  }
}

} // namespace react
} // namespace facebook
