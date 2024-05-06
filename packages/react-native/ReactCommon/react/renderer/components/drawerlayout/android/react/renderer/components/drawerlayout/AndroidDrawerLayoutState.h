/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>

#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook::react {

/*
 * State for <AndroidDrawerLayout> component.
 */
class AndroidDrawerLayoutState final {
 public:
  using Shared = std::shared_ptr<const AndroidDrawerLayoutState>;

  AndroidDrawerLayoutState(){};
  AndroidDrawerLayoutState(
      const AndroidDrawerLayoutState& previousState,
      folly::dynamic data)
      : drawerWidth((Float)data["drawerWidth"].getDouble()),
        containerWidth((Float)data["containerWidth"].getDouble()),
        drawerOnLeft(data["drawerOnLeft"].getBool()),
        drawerOpened(data["drawerOpened"].getBool()) {};

  const Float drawerWidth = 0;
  const Float containerWidth = 0;
  const bool drawerOnLeft = true;
  const bool drawerOpened = false;

  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };

#pragma mark - Getters
};

} // namespace facebook::react
