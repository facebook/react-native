/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

/*
 * Dummy type that is used as a placeholder for state data for nodes that
 * don't have a state.
 */
struct StateData final {
  using Shared = std::shared_ptr<void>;

#ifdef ANDROID
  StateData() = default;
  StateData(folly::dynamic data){};
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
