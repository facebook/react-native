/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <memory>

#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * Dummy type that is used as a placeholder for state data for nodes that
 * don't have a state.
 */
struct StateData final {
  using Shared = std::shared_ptr<const void>;

  StateData() = default;
  StateData(const StateData& previousState, folly::dynamic data) {}
  folly::dynamic getDynamic() const;

#ifdef ANDROID
  MapBuffer getMapBuffer() const;
#endif
};

} // namespace facebook::react
