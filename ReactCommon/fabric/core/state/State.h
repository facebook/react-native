/**
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

#ifdef ANDROID
  virtual const folly::dynamic getDynamic() const;
  virtual void updateState(folly::dynamic data) const;
#endif

 protected:
  StateCoordinator::Shared stateCoordinator_;

 private:
  friend class ShadowNode;
  friend class StateCoordinator;

  /*
   * Must be used by `ShadowNode` *only*.
   */
  void commit(const ShadowNode &shadowNode) const;

  /*
   * Must be used by `ShadowNode` *only*.
   */
  const State::Shared &getCommitedState() const;
};

} // namespace react
} // namespace facebook
