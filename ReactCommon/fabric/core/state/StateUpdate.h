/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/core/StateData.h>
#include <react/core/StateTarget.h>

namespace facebook {
namespace react {

/*
 * Carries some logic and additional information about state update transaction.
 */
class StateUpdate {
 public:
  std::pair<StateTarget, StateData::Shared> operator()() const;

  /*
   * The current implementation simply uses `std::function` inside that captures
   * everything which is needed to perform state update. That will be probably
   * changed in the future.
   */
  std::function<std::pair<StateTarget, StateData::Shared>()> callback_;
};

} // namespace react
} // namespace facebook
