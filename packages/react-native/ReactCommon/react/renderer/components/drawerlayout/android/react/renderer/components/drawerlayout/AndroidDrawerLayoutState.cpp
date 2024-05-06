/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidDrawerLayoutState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic AndroidDrawerLayoutState::getDynamic() const {
  return folly::dynamic::object("drawerOpened", drawerOpened)("drawerOnLeft", drawerOnLeft)(
      "drawerWidth", drawerWidth)("containerWidth", containerWidth);
}
#endif

} // namespace facebook::react
