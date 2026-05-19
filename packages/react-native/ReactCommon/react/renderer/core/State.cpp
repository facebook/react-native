/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "State.h"

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/State.h>
#include <react/renderer/core/StateData.h>

#include <utility>

namespace facebook::react {

State::State(StateData::Shared data, const State& previousState)
    : family_(previousState.family_),
      data_(std::move(data)),
      revision_(previousState.revision_ + 1) {};

State::State(StateData::Shared data, ShadowNodeFamily::Weak family)
    : family_(std::move(family)),
      data_(std::move(data)),
      revision_{State::initialRevisionValue} {};

State::Shared State::getMostRecentState() const {
  auto family = family_.lock();
  if (!family) {
    return {};
  }

  return family->getMostRecentState();
}

State::Shared State::getMostRecentStateIfObsolete() const {
  auto family = family_.lock();
  if (!family) {
    return {};
  }

  return family->getMostRecentStateIfObsolete(*this);
}

size_t State::getRevision() const {
  return revision_;
}

} // namespace facebook::react
