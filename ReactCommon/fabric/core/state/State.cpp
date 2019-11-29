/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "State.h"

#include <glog/logging.h>
#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/core/State.h>
#include <react/core/StateTarget.h>
#include <react/core/StateUpdate.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

State::State(State const &state) : stateCoordinator_(state.stateCoordinator_){};

State::State(StateCoordinator::Shared const &stateCoordinator)
    : stateCoordinator_(stateCoordinator){};

void State::commit(std::shared_ptr<ShadowNode const> const &shadowNode) const {
  stateCoordinator_->setTarget(StateTarget{shadowNode});
}

State::Shared State::getMostRecentState() const {
  auto target = stateCoordinator_->getTarget();
  return target ? target.getShadowNode().getState()
                : ShadowNodeFragment::statePlaceholder();
}

} // namespace react
} // namespace facebook
