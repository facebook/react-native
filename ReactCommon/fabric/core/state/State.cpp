/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "State.h"

#include <react/core/ShadowNode.h>
#include <react/core/State.h>
#include <react/core/StateTarget.h>
#include <react/core/StateUpdate.h>

namespace facebook {
namespace react {

State::State(StateCoordinator::Shared stateCoordinator)
    : stateCoordinator_(std::move(stateCoordinator)){};

void State::commit(const ShadowNode &shadowNode) const {
  stateCoordinator_->setTarget(StateTarget{shadowNode});
}

const State::Shared &State::getCommitedState() const {
  return stateCoordinator_->getTarget().getShadowNode().getState();
}

} // namespace react
} // namespace facebook
