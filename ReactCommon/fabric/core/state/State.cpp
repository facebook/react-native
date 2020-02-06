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

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

State::State(State const &state)
    : family_(state.family_), revision_(state.revision_ + 1){};

State::State(ShadowNodeFamily::Shared const &family)
    : family_(family), revision_{1} {};

void State::commit(std::shared_ptr<ShadowNode const> const &shadowNode) const {
  family_->setTarget(StateTarget{shadowNode});
}

State::Shared State::getMostRecentState() const {
  auto target = family_->getTarget();
  return target ? target.getShadowNode().getState()
                : ShadowNodeFragment::statePlaceholder();
}

size_t State::getRevision() const {
  return revision_;
}

} // namespace react
} // namespace facebook
