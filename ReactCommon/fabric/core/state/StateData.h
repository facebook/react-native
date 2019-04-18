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
 * Base class for state data.
 * Must be used to provide getDynamic for Android.
 */
class StateData {
 public:
  using Shared = std::shared_ptr<void>;

  StateData() {}

#ifdef ANDROID
  StateData(folly::dynamic data) {}

  // Destructor must either be virtual or protected if we have any
  // virtual methods
  virtual ~StateData();

  virtual const folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
