/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SwitchEventEmitter.h"

namespace facebook {
namespace react {

void SwitchEventEmitter::onChange(const bool &value) const {
  dispatchEvent("change", folly::dynamic::object("value", value));
}

} // namespace react
} // namespace facebook
