/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropViewEventEmitter.h"
#include <iostream>

namespace facebook {
namespace react {
void LegacyViewManagerInteropViewEventEmitter::dispatchEvent(
    std::string const &type,
    folly::dynamic const &payload) const {
  EventEmitter::dispatchEvent(type, payload);
}

} // namespace react
} // namespace facebook
