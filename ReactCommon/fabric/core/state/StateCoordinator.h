/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/mutex.h>
#include <mutex>

#include <react/core/EventDispatcher.h>
#include <react/core/StateTarget.h>

namespace facebook {
namespace react {

/*
 * Coordinates a vision of the same state values between shadow nodes from
 * the same family.
 */
class StateCoordinator {
 public:
  using Shared = std::shared_ptr<const StateCoordinator>;

  StateCoordinator(EventDispatcher::Weak eventDispatcher);

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchRawState(StateUpdate &&stateUpdate, EventPriority priority)
      const;

  /*
   * Sets and gets a state target.
   */
  const StateTarget &getTarget() const;
  void setTarget(StateTarget &&target) const;

 private:
  EventDispatcher::Weak eventDispatcher_;
  mutable StateTarget target_{}; // Protected by `mutex_`.
  mutable better::shared_mutex mutex_;
};

} // namespace react
} // namespace facebook
