/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SafeAreaViewState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic SafeAreaViewState::getDynamic() const {
  return folly::dynamic::object("left", padding.left)("top", padding.top)(
      "right", padding.right)("bottom", padding.bottom);
}
#endif

} // namespace facebook::react
