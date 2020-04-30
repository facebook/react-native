/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/core/StateCoordinator.h>

namespace facebook {
namespace react {

class ShadowNode;

/*
 * An abstract interface of State.
 * State is used to control and continuously advance a single vision of some
 * state (arbitrary data) associated with a family of shadow nodes.
 */
class State {
 public:
  using Shared = std::shared_ptr<const State>;

  explicit State(State const &state);
  explicit State(StateCoordinator::Shared const &stateCoordinator);
  virtual ~State() = default;

  /*
   * Returns a momentary value of the most recently committed state
   * associated with a family of nodes which this state belongs to.
   * Sequential calls might return different values.
   */
  State::Shared getMostRecentState() const;

#ifdef ANDROID
  virtual folly::dynamic getDynamic() const = 0;
  virtual void updateState(folly::dynamic data) const = 0;
#endif

  void commit(std::shared_ptr<ShadowNode const> const &shadowNode) const;

 protected:
  StateCoordinator::Shared stateCoordinator_;

 private:
  friend class StateCoordinator;

  /*
   * Indicates that the state was committed once and then was replaced by a
   * newer one.
   * To be used by `StateCoordinator` only.
   * Protected by mutex inside `StateCoordinator`.
   */
  mutable bool isObsolete_{false};
};

} // namespace react
} // namespace facebook
