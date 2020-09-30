/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "State.h"

#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/core/State.h>
#include <react/core/StateData.h>

namespace facebook {
namespace react {

State::State(StateData::Shared const &data, State const &state)
    : family_(state.family_), data_(data), revision_(state.revision_ + 1){};

State::State(
    StateData::Shared const &data,
    ShadowNodeFamily::Shared const &family)
    : family_(family), data_(data), revision_{State::initialRevisionValue} {};

State::Shared State::getMostRecentState() const {
  auto family = family_.lock();
  if (!family) {
    return {};
  }

  return family->getMostRecentState();
}

size_t State::getRevision() const {
  return revision_;
}

} // namespace react
} // namespace facebook
