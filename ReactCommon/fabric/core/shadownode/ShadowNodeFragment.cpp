/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFragment.h"

namespace facebook {
namespace react {

Tag const ShadowNodeFragment::tagPlaceholder() {
  return 0;
}

SurfaceId const ShadowNodeFragment::surfaceIdPlaceholder() {
  return 0;
}

Props::Shared const &ShadowNodeFragment::propsPlaceholder() {
  static auto &instance = *new Props::Shared();
  return instance;
}

EventEmitter::Shared const &ShadowNodeFragment::eventEmitterPlaceholder() {
  static auto &instance = *new EventEmitter::Shared();
  return instance;
}

ShadowNode::SharedListOfShared const &
ShadowNodeFragment::childrenPlaceholder() {
  static auto &instance = *new ShadowNode::SharedListOfShared();
  return instance;
}

LocalData::Shared const &ShadowNodeFragment::localDataPlaceholder() {
  static auto &instance = *new LocalData::Shared();
  return instance;
}

State::Shared const &ShadowNodeFragment::statePlaceholder() {
  static auto &instance = *new State::Shared();
  return instance;
}

} // namespace react
} // namespace facebook
