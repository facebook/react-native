/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Constants.h"

namespace facebook {
namespace react {

static bool isPropsForwardingEnabled = false;

void Constants::setPropsForwardingEnabled(bool propsForwardingEnabled) {
  isPropsForwardingEnabled = propsForwardingEnabled;
}

bool Constants::getPropsForwardingEnabled() {
  return isPropsForwardingEnabled;
}

} // namespace react
} // namespace facebook
